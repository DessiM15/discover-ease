import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailTemplates, sendTemplatedEmail } from "@/lib/email/sendgrid";
import { sendTemplatedSms, smsTemplates, isSmsConfigured } from "@/lib/sms/twilio";
import { sendSlackMessage, sendSlackWebhook, slackTemplates } from "@/lib/integrations/slack";
import { sendTeamsCard, sendTeamsWebhook, teamsTemplates } from "@/lib/integrations/teams";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Workflow trigger types
export type WorkflowTrigger =
  // Discovery triggers
  | "discovery_request_created"
  | "discovery_request_served"
  | "discovery_response_due"
  | "discovery_response_received"
  | "discovery_deadline_approaching"
  // Document triggers
  | "document_uploaded"
  | "document_reviewed"
  | "document_filed"
  // Case triggers
  | "case_created"
  | "case_status_changed"
  | "case_assigned"
  // Deadline triggers
  | "deadline_approaching"
  | "deadline_today"
  | "deadline_overdue"
  // Billing triggers
  | "invoice_created"
  | "invoice_sent"
  | "payment_received"
  | "payment_overdue"
  // Task triggers
  | "task_created"
  | "task_assigned"
  | "task_completed"
  | "task_overdue";

// Action types
export type WorkflowAction =
  | "send_email"
  | "send_sms"
  | "create_task"
  | "create_notification"
  | "send_slack_message"
  | "send_teams_message"
  | "update_case_status"
  | "assign_to_user";

// Workflow step definition
export interface WorkflowStep {
  id: string;
  order: number;
  action: WorkflowAction;
  config: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  delayMinutes?: number;
}

// Condition for step execution
export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string | number | boolean;
}

// Workflow definition
export interface Workflow {
  id: string;
  firmId: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  caseType?: string;
  isActive: boolean;
  steps: WorkflowStep[];
}

// Event data passed to workflows
export interface WorkflowEventData {
  firmId: string;
  caseId?: string;
  caseName?: string;
  caseNumber?: string;
  userId?: string;
  entityId: string;
  entityType: string;
  metadata: Record<string, unknown>;
}

// Execute a workflow
export async function executeWorkflow(
  workflow: Workflow,
  eventData: WorkflowEventData
): Promise<void> {
  const supabase = await createClient();

  // Log workflow execution start
  await supabase.from("workflow_executions").insert({
    workflow_id: workflow.id,
    firm_id: workflow.firmId,
    trigger_event: JSON.stringify(eventData),
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    // Sort steps by order
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

    for (const step of sortedSteps) {
      // Check conditions
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = evaluateConditions(step.conditions, eventData);
        if (!conditionsMet) continue;
      }

      // Handle delay
      if (step.delayMinutes && step.delayMinutes > 0) {
        // Schedule for later execution
        await supabase.from("scheduled_workflow_steps").insert({
          workflow_id: workflow.id,
          step_id: step.id,
          event_data: JSON.stringify(eventData),
          execute_at: new Date(Date.now() + step.delayMinutes * 60 * 1000).toISOString(),
        });
        continue;
      }

      // Execute the step
      await executeStep(step, eventData, supabase);
    }

    // Log workflow completion
    await supabase
      .from("workflow_executions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflow.id)
      .eq("status", "running");
  } catch (error) {
    console.error("Workflow execution error:", error);

    // Log workflow failure
    await supabase
      .from("workflow_executions")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflow.id)
      .eq("status", "running");
  }
}

// Evaluate conditions
function evaluateConditions(
  conditions: WorkflowCondition[],
  data: WorkflowEventData
): boolean {
  for (const condition of conditions) {
    const value = getNestedValue(data as unknown as Record<string, unknown>, condition.field);

    switch (condition.operator) {
      case "equals":
        if (value !== condition.value) return false;
        break;
      case "not_equals":
        if (value === condition.value) return false;
        break;
      case "contains":
        if (typeof value !== "string" || !value.includes(String(condition.value)))
          return false;
        break;
      case "greater_than":
        if (Number(value) <= Number(condition.value)) return false;
        break;
      case "less_than":
        if (Number(value) >= Number(condition.value)) return false;
        break;
    }
  }
  return true;
}

// Get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

// Execute a single step
async function executeStep(
  step: WorkflowStep,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  switch (step.action) {
    case "send_email":
      await executeSendEmail(step.config, eventData, supabase);
      break;
    case "send_sms":
      await executeSendSms(step.config, eventData, supabase);
      break;
    case "create_task":
      await executeCreateTask(step.config, eventData, supabase);
      break;
    case "create_notification":
      await executeCreateNotification(step.config, eventData, supabase);
      break;
    case "send_slack_message":
      await executeSendSlack(step.config, eventData, supabase);
      break;
    case "send_teams_message":
      await executeSendTeams(step.config, eventData, supabase);
      break;
    case "update_case_status":
      await executeUpdateCaseStatus(step.config, eventData, supabase);
      break;
    case "assign_to_user":
      await executeAssignToUser(step.config, eventData, supabase);
      break;
  }
}

// Send email action
async function executeSendEmail(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const recipientType = config.recipientType as string;
  let recipients: string[] = [];

  // Determine recipients
  if (recipientType === "case_team") {
    const { data: team } = await supabase
      .from("case_team")
      .select("users(email)")
      .eq("case_id", eventData.caseId);
    recipients = (team || [])
      .map((t) => {
        const users = t.users && typeof t.users === "object" && !Array.isArray(t.users)
          ? t.users as { email?: string }
          : null;
        return users?.email;
      })
      .filter((email): email is string => Boolean(email));
  } else if (recipientType === "assigned_user" && eventData.userId) {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", eventData.userId)
      .single();
    if (user?.email) recipients = [user.email];
  } else if (recipientType === "firm_admins") {
    const { data: admins } = await supabase
      .from("users")
      .select("email")
      .eq("firm_id", eventData.firmId)
      .in("role", ["owner", "admin"]);
    recipients = (admins || []).map((a) => a.email).filter(Boolean);
  } else if (config.email) {
    recipients = [config.email as string];
  }

  if (recipients.length === 0) return;

  // Build email content
  const subject = interpolate(config.subject as string, eventData);
  const body = interpolate(config.body as string, eventData);

  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ""),
    });
  }
}

// Send SMS action
async function executeSendSms(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  if (!isSmsConfigured()) return;

  const recipientType = config.recipientType as string;
  let phoneNumbers: string[] = [];

  if (recipientType === "assigned_user" && eventData.userId) {
    const { data: user } = await supabase
      .from("users")
      .select("phone")
      .eq("id", eventData.userId)
      .single();
    if (user?.phone) phoneNumbers = [user.phone];
  } else if (config.phone) {
    phoneNumbers = [config.phone as string];
  }

  if (phoneNumbers.length === 0) return;

  const message = interpolate(config.message as string, eventData);

  for (const phone of phoneNumbers) {
    await sendTemplatedSms(phone, { body: message });
  }
}

// Create task action
async function executeCreateTask(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const title = interpolate(config.title as string, eventData);
  const description = config.description
    ? interpolate(config.description as string, eventData)
    : undefined;

  let assignedToId = config.assignedToId as string | undefined;
  if (config.assignTo === "case_lead" && eventData.caseId) {
    const { data: caseData } = await supabase
      .from("cases")
      .select("lead_attorney_id")
      .eq("id", eventData.caseId)
      .single();
    assignedToId = caseData?.lead_attorney_id;
  }

  let dueDate: Date | undefined;
  if (config.dueDays) {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config.dueDays as number));
  }

  await supabase.from("tasks").insert({
    firm_id: eventData.firmId,
    case_id: eventData.caseId,
    title,
    description,
    status: "pending",
    priority: (config.priority as string) || "medium",
    due_date: dueDate?.toISOString(),
    assigned_to_id: assignedToId,
  });
}

// Create notification action
async function executeCreateNotification(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const recipientType = config.recipientType as string;
  let userIds: string[] = [];

  if (recipientType === "case_team" && eventData.caseId) {
    const { data: team } = await supabase
      .from("case_team")
      .select("user_id")
      .eq("case_id", eventData.caseId);
    userIds = (team || []).map((t) => t.user_id).filter(Boolean);
  } else if (recipientType === "assigned_user" && eventData.userId) {
    userIds = [eventData.userId];
  } else if (recipientType === "firm_admins") {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("firm_id", eventData.firmId)
      .in("role", ["owner", "admin"]);
    userIds = (admins || []).map((a) => a.id).filter(Boolean);
  }

  if (userIds.length === 0) return;

  const title = interpolate(config.title as string, eventData);
  const message = interpolate(config.message as string, eventData);

  await supabase.from("notifications").insert(
    userIds.map((userId) => ({
      user_id: userId,
      type: config.notificationType || "workflow",
      title,
      message,
      entity_type: eventData.entityType,
      entity_id: eventData.entityId,
      action_url: config.actionUrl
        ? interpolate(config.actionUrl as string, eventData)
        : undefined,
    }))
  );
}

// Send Slack message action
async function executeSendSlack(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  // Get firm's Slack integration
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("firm_id", eventData.firmId)
    .eq("provider", "slack")
    .eq("is_enabled", true)
    .single();

  if (!integration) return;

  const channel = (config.channel as string) || integration.default_channel;
  const message = interpolate(config.message as string, eventData);

  if (integration.webhook_url) {
    await sendSlackWebhook(integration.webhook_url, {
      text: message,
    });
  } else if (integration.access_token && channel) {
    await sendSlackMessage(integration.access_token, {
      channel,
      text: message,
    });
  }
}

// Send Teams message action
async function executeSendTeams(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  // Get firm's Teams integration
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("firm_id", eventData.firmId)
    .eq("provider", "teams")
    .eq("is_enabled", true)
    .single();

  if (!integration) return;

  const message = interpolate(config.message as string, eventData);

  if (integration.webhook_url) {
    await sendTeamsWebhook(integration.webhook_url, {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: message,
          wrap: true,
        },
      ],
    });
  } else if (integration.access_token && config.teamId && config.channelId) {
    await sendTeamsCard(
      integration.access_token,
      config.teamId as string,
      config.channelId as string,
      {
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          {
            type: "TextBlock",
            text: message,
            wrap: true,
          },
        ],
      }
    );
  }
}

// Update case status action
async function executeUpdateCaseStatus(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  if (!eventData.caseId) return;

  await supabase
    .from("cases")
    .update({
      status: config.newStatus as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventData.caseId);
}

// Assign to user action
async function executeAssignToUser(
  config: Record<string, unknown>,
  eventData: WorkflowEventData,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const table = config.entityTable as string;
  const userId = config.userId as string;

  if (!eventData.entityId || !table || !userId) return;

  await supabase
    .from(table)
    .update({
      assigned_to_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventData.entityId);
}

// Interpolate template variables
function interpolate(template: string, data: WorkflowEventData): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data as unknown as Record<string, unknown>, path);
    return value !== undefined ? String(value) : match;
  });
}

// Trigger a workflow by event
export async function triggerWorkflow(
  trigger: WorkflowTrigger,
  eventData: WorkflowEventData
): Promise<void> {
  const supabase = await createClient();

  // Find matching workflows
  const query = supabase
    .from("workflows")
    .select("*")
    .eq("firm_id", eventData.firmId)
    .eq("trigger", trigger)
    .eq("is_active", true);

  // Filter by case type if applicable
  if (eventData.metadata.caseType) {
    query.or(`case_type.is.null,case_type.eq.${eventData.metadata.caseType}`);
  }

  const { data: workflows } = await query;

  if (!workflows || workflows.length === 0) return;

  // Execute each matching workflow
  for (const workflowRow of workflows) {
    const workflow: Workflow = {
      id: workflowRow.id,
      firmId: workflowRow.firm_id,
      name: workflowRow.name,
      description: workflowRow.description,
      trigger: workflowRow.trigger as WorkflowTrigger,
      caseType: workflowRow.case_type,
      isActive: workflowRow.is_active,
      steps: (workflowRow.steps as WorkflowStep[]) || [],
    };

    await executeWorkflow(workflow, eventData);
  }
}

// Create default workflows for a firm
export async function createDefaultWorkflows(firmId: string): Promise<void> {
  const supabase = await createClient();

  const defaultWorkflows = [
    {
      firm_id: firmId,
      name: "Discovery Deadline Reminder",
      description: "Send reminders for upcoming discovery deadlines",
      trigger: "discovery_deadline_approaching",
      is_active: true,
      steps: [
        {
          id: "step-1",
          order: 1,
          action: "create_notification",
          config: {
            recipientType: "assigned_user",
            title: "Discovery Deadline Approaching",
            message: "Discovery request '{{metadata.requestTitle}}' for {{caseName}} is due on {{metadata.dueDate}}",
            actionUrl: "/discovery/{{entityId}}",
          },
        },
        {
          id: "step-2",
          order: 2,
          action: "send_email",
          config: {
            recipientType: "assigned_user",
            subject: "Discovery Deadline: {{metadata.requestTitle}}",
            body: "<p>The discovery request <strong>{{metadata.requestTitle}}</strong> for case <strong>{{caseName}}</strong> is due on {{metadata.dueDate}}.</p><p>Please ensure all responses are prepared and filed on time.</p>",
          },
        },
      ],
    },
    {
      firm_id: firmId,
      name: "Document Upload Notification",
      description: "Notify case team when a new document is uploaded",
      trigger: "document_uploaded",
      is_active: true,
      steps: [
        {
          id: "step-1",
          order: 1,
          action: "create_notification",
          config: {
            recipientType: "case_team",
            title: "New Document Uploaded",
            message: "{{metadata.uploadedBy}} uploaded '{{metadata.documentName}}' to {{caseName}}",
            actionUrl: "/documents/{{entityId}}",
          },
        },
      ],
    },
    {
      firm_id: firmId,
      name: "Case Deadline Reminder",
      description: "Send reminders for important case deadlines",
      trigger: "deadline_approaching",
      is_active: true,
      steps: [
        {
          id: "step-1",
          order: 1,
          action: "send_email",
          config: {
            recipientType: "case_team",
            subject: "Deadline Reminder: {{metadata.eventTitle}}",
            body: "<p>This is a reminder that <strong>{{metadata.eventTitle}}</strong> for case <strong>{{caseName}}</strong> is coming up on {{metadata.eventDate}}.</p>",
          },
        },
        {
          id: "step-2",
          order: 2,
          action: "create_notification",
          config: {
            recipientType: "case_team",
            title: "Deadline Approaching",
            message: "{{metadata.eventTitle}} for {{caseName}} is on {{metadata.eventDate}}",
            actionUrl: "/calendar",
          },
        },
      ],
    },
  ];

  for (const workflow of defaultWorkflows) {
    await supabase.from("workflows").insert(workflow);
  }
}
