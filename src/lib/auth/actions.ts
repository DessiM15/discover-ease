"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  firmName: string
) {
  const supabase = await createClient();

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        firm_name: firmName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Create firm in database
  const { data: firmData, error: firmError } = await supabase
    .from("firms")
    .insert({
      name: firmName,
      email: email,
    })
    .select()
    .single();

  if (firmError) {
    // If firm creation fails, we should clean up the auth user
    // But Supabase doesn't allow deleting users from server actions easily
    return { error: `Failed to create firm: ${firmError.message}` };
  }

  // Create user record in database
  const { error: userError } = await supabase.from("users").insert({
    id: authData.user.id,
    firm_id: firmData.id,
    email: email,
    first_name: firstName,
    last_name: lastName,
    role: "owner",
  });

  if (userError) {
    return { error: `Failed to create user record: ${userError.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

