/**
 * Seed script for DiscoverEase demo data
 * 
 * This script creates realistic, professional demo data for Mitchell & Associates, P.C.
 * Run with: npx tsx scripts/seed.ts
 * 
 * Make sure DATABASE_URL is set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fixed UUIDs for consistency
const FIRM_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_IDS = {
  sarah: '550e8400-e29b-41d4-a716-446655440001',
  david: '550e8400-e29b-41d4-a716-446655440002',
  maria: '550e8400-e29b-41d4-a716-446655440003',
  jennifer: '550e8400-e29b-41d4-a716-446655440004',
  michael: '550e8400-e29b-41d4-a716-446655440005',
};

const CASE_IDS = {
  johnson: '550e8400-e29b-41d4-a716-446655440010',
  williams: '550e8400-e29b-41d4-a716-446655440011',
  martinez: '550e8400-e29b-41d4-a716-446655440012',
  davis: '550e8400-e29b-41d4-a716-446655440013',
  techstart: '550e8400-e29b-41d4-a716-446655440014',
};

// Store case results for later reference
const caseResultsMap: Record<string, any> = {};

async function seed() {
  console.log('🌱 Starting seed...\n');

  try {
    // 1. Create Firm
    console.log('Creating firm...');
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .upsert({
        id: FIRM_ID,
        name: 'Mitchell & Associates, P.C.',
        email: 'info@mitchelllaw.com',
        phone: '(713) 555-0150',
        address: '1200 Main Street, Suite 2400',
        city: 'Houston',
        state: 'TX',
        zip_code: '77002',
        timezone: 'America/Chicago',
        default_billing_rate: '350.00',
        subscription_tier: 'professional',
        subscription_status: 'active',
      }, { onConflict: 'id' })
      .select()
      .single();

    if (firmError) throw firmError;
    console.log('✅ Firm created\n');

    // 2. Create Users
    console.log('Creating users...');
    const users = [
      {
        id: USER_IDS.sarah,
        firm_id: FIRM_ID,
        email: 'sarah@mitchelllaw.com',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        role: 'owner',
        title: 'Managing Partner',
        billing_rate: '450.00',
        is_active: true,
      },
      {
        id: USER_IDS.david,
        firm_id: FIRM_ID,
        email: 'david@mitchelllaw.com',
        first_name: 'David',
        last_name: 'Chen',
        role: 'attorney',
        title: 'Senior Associate',
        billing_rate: '350.00',
        is_active: true,
      },
      {
        id: USER_IDS.maria,
        firm_id: FIRM_ID,
        email: 'maria@mitchelllaw.com',
        first_name: 'Maria',
        last_name: 'Rodriguez',
        role: 'attorney',
        title: 'Associate',
        billing_rate: '275.00',
        is_active: true,
      },
      {
        id: USER_IDS.jennifer,
        firm_id: FIRM_ID,
        email: 'jennifer@mitchelllaw.com',
        first_name: 'Jennifer',
        last_name: 'Park',
        role: 'paralegal',
        title: 'Paralegal',
        billing_rate: '150.00',
        is_active: true,
      },
      {
        id: USER_IDS.michael,
        firm_id: FIRM_ID,
        email: 'michael@mitchelllaw.com',
        first_name: 'Michael',
        last_name: 'Thompson',
        role: 'secretary',
        title: 'Legal Secretary',
        billing_rate: '95.00',
        is_active: true,
      },
    ];

    for (const user of users) {
      const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
      if (error) throw error;
    }
    console.log('✅ Users created\n');

    // 3. Create Contacts
    console.log('Creating contacts...');
    const contacts = [
      // Clients
      {
        firm_id: FIRM_ID,
        type: 'client',
        first_name: 'Robert',
        last_name: 'Johnson',
        email: 'robert.johnson@email.com',
        phone: '(713) 555-0187',
        address: '4521 Oak Lane',
        city: 'Houston',
        state: 'TX',
        zip_code: '77027',
      },
      {
        firm_id: FIRM_ID,
        type: 'client',
        company_name: 'Williams Family Trust',
        first_name: 'Margaret',
        last_name: 'Williams',
        phone: '(713) 555-0199',
        email: 'margaret.williams@email.com',
      },
      {
        firm_id: FIRM_ID,
        type: 'client',
        first_name: 'Elena',
        last_name: 'Martinez',
        email: 'elena.m@email.com',
        phone: '(832) 555-0145',
      },
      {
        firm_id: FIRM_ID,
        type: 'client',
        first_name: 'Marcus',
        last_name: 'Davis',
        email: 'mdavis@email.com',
        phone: '(281) 555-0176',
      },
      {
        firm_id: FIRM_ID,
        type: 'client',
        company_name: 'TechStart Inc.',
        first_name: 'Amanda',
        last_name: 'Foster',
        email: 'amanda@techstart.io',
        phone: '(713) 555-0200',
        title: 'CEO',
      },
      // Opposing Parties
      {
        firm_id: FIRM_ID,
        type: 'opposing_party',
        company_name: 'ABC Manufacturing Corp.',
        email: 'legal@abcmfg.com',
      },
      {
        firm_id: FIRM_ID,
        type: 'opposing_party',
        first_name: 'Carlos',
        last_name: 'Martinez',
      },
      {
        firm_id: FIRM_ID,
        type: 'opposing_party',
        company_name: 'DataFlow Solutions LLC',
        first_name: 'Brian',
        last_name: 'Walsh',
        email: 'legal@dataflow.io',
        title: 'CEO',
      },
      // Opposing Counsel
      {
        firm_id: FIRM_ID,
        type: 'opposing_counsel',
        first_name: 'James',
        last_name: 'Williams',
        company_name: 'Williams & Hart LLP',
        email: 'jwilliams@williamshart.com',
        phone: '(713) 555-0300',
      },
      {
        firm_id: FIRM_ID,
        type: 'opposing_counsel',
        first_name: 'Robert',
        last_name: 'Garcia',
        email: 'rgarcia@garcialaw.com',
        phone: '(832) 555-0188',
      },
      {
        firm_id: FIRM_ID,
        type: 'opposing_counsel',
        first_name: 'Katherine',
        last_name: 'Morrison',
        company_name: 'Morrison & Reed LLP',
        email: 'kmorrison@morrisonreed.com',
        phone: '(713) 555-0400',
      },
      // Experts
      {
        firm_id: FIRM_ID,
        type: 'expert',
        first_name: 'Michael',
        last_name: 'Chen',
        title: 'Dr.',
        email: 'mchen@houstonortho.com',
        phone: '(713) 555-0500',
      },
      {
        firm_id: FIRM_ID,
        type: 'expert',
        first_name: 'Sarah',
        last_name: 'Thompson',
        title: 'CPA',
        email: 'sthompson@forensicaccounting.com',
        phone: '(713) 555-0600',
      },
      {
        firm_id: FIRM_ID,
        type: 'expert',
        first_name: 'James',
        last_name: 'Wilson',
        title: 'Dr.',
        email: 'jwilson@vocationalexpert.com',
        phone: '(713) 555-0700',
      },
      {
        firm_id: FIRM_ID,
        type: 'expert',
        first_name: 'Robert',
        last_name: 'Anderson',
        title: 'MBA',
        email: 'randerson@businessvaluation.com',
        phone: '(713) 555-0800',
      },
    ];

    const contactResults: any[] = [];
    for (const contact of contacts) {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      if (data) contactResults.push(data);
    }
    console.log('✅ Contacts created\n');

    // Find contact IDs by name/email
    const getContactId = (identifier: string) => {
      const contact = contactResults.find(
        (c) =>
          c.email === identifier ||
          `${c.first_name} ${c.last_name}` === identifier ||
          c.company_name === identifier ||
          (c.first_name && c.last_name && `${c.first_name} ${c.last_name}`.toLowerCase() === identifier.toLowerCase())
      );
      return contact?.id;
    };

    // 4. Create Cases
    console.log('Creating cases...');
    const cases = [
      {
        id: CASE_IDS.johnson,
        firm_id: FIRM_ID,
        case_number: '2024-CV-00847',
        name: 'Johnson v. ABC Manufacturing Corp.',
        type: 'personal_injury',
        status: 'active',
        description:
          'Workplace injury case involving machinery malfunction. Client suffered severe hand injury requiring multiple surgeries.',
        court: 'Harris County District Court, 152nd Judicial District',
        judge: 'Hon. Patricia Williams',
        court_case_number: '2024-CV-00847',
        jurisdiction: 'Harris County, Texas',
        date_opened: '2024-03-15T00:00:00Z',
        statute_of_limitations: '2026-03-15T00:00:00Z',
        discovery_cutoff: '2025-06-30T00:00:00Z',
        trial_date: '2025-09-15T00:00:00Z',
        billing_type: 'contingency',
        bates_prefix: 'JOHNSON',
        current_bates_number: '310',
        lead_attorney_id: USER_IDS.sarah,
        practice_area: 'Personal Injury',
      },
      {
        id: CASE_IDS.williams,
        firm_id: FIRM_ID,
        case_number: '2024-PR-00234',
        name: 'Estate of Williams',
        type: 'estate_planning',
        status: 'active',
        description:
          'Complex estate administration involving multiple properties and beneficiaries. Estate valued at approximately $4.2M.',
        court: 'Harris County Probate Court No. 2',
        judge: 'Hon. Michael Sanders',
        court_case_number: '2024-PR-00234',
        jurisdiction: 'Harris County, Texas',
        date_opened: '2024-01-08T00:00:00Z',
        billing_type: 'hourly',
        bates_prefix: 'WILLIAMS',
        current_bates_number: '125',
        lead_attorney_id: USER_IDS.david,
        practice_area: 'Estate Planning',
      },
      {
        id: CASE_IDS.martinez,
        firm_id: FIRM_ID,
        case_number: '2024-FM-01122',
        name: 'Martinez v. Martinez',
        type: 'divorce',
        status: 'active',
        description:
          'High-asset divorce involving business valuation, custody dispute for two minor children, and complex property division.',
        court: 'Harris County Family District Court',
        judge: 'Hon. Rebecca Torres',
        court_case_number: '2024-FM-01122',
        jurisdiction: 'Harris County, Texas',
        date_opened: '2024-05-03T00:00:00Z',
        billing_type: 'hourly',
        bates_prefix: 'MARTINEZ',
        current_bates_number: '89',
        lead_attorney_id: USER_IDS.maria,
        practice_area: 'Family Law',
      },
      {
        id: CASE_IDS.davis,
        firm_id: FIRM_ID,
        case_number: '2024-CR-00567',
        name: 'State v. Davis',
        type: 'criminal_defense',
        status: 'pending',
        description:
          'DWI defense, second offense. Client is a commercial driver whose livelihood depends on maintaining his CDL.',
        court: 'Harris County Criminal Court at Law No. 5',
        judge: 'Hon. William Brown',
        court_case_number: '2024-CR-00567',
        jurisdiction: 'Harris County, Texas',
        date_opened: '2024-06-20T00:00:00Z',
        billing_type: 'flat_fee',
        bates_prefix: 'DAVIS',
        current_bates_number: '45',
        lead_attorney_id: USER_IDS.sarah,
        practice_area: 'Criminal Defense',
      },
      {
        id: CASE_IDS.techstart,
        firm_id: FIRM_ID,
        case_number: '2024-CV-02341',
        name: 'TechStart Inc. v. DataFlow Solutions',
        type: 'contract_dispute',
        status: 'active',
        description:
          'Breach of software licensing agreement. Client alleges defendant exceeded licensed user count and owes $890,000 in damages.',
        court: 'U.S. District Court, Southern District of Texas',
        judge: 'Hon. Andrew Cooper',
        court_case_number: '2024-CV-02341',
        jurisdiction: 'Federal Court',
        date_opened: '2024-04-01T00:00:00Z',
        discovery_cutoff: '2024-12-15T00:00:00Z',
        trial_date: '2025-03-03T00:00:00Z',
        billing_type: 'hourly',
        bates_prefix: 'TECHSTART',
        current_bates_number: '156',
        lead_attorney_id: USER_IDS.david,
        practice_area: 'Business Litigation',
      },
    ];

    const caseResults = [];
    for (const caseData of cases) {
      const { data, error } = await supabase.from('cases').upsert(caseData, { onConflict: 'id' }).select().single();
      if (error) throw error;
      caseResults.push(data);
      // Map by case number for easy lookup
      if (data.case_number) {
        caseResultsMap[data.case_number] = data;
      }
    }
    console.log('✅ Cases created\n');

    // 5. Link Contacts to Cases
    console.log('Linking contacts to cases...');
    const caseContacts = [
      {
        case_id: CASE_IDS.johnson,
        contact_id: getContactId('robert.johnson@email.com'),
        role: 'plaintiff',
        is_primary: true,
      },
      {
        case_id: CASE_IDS.johnson,
        contact_id: getContactId('ABC Manufacturing Corp.'),
        role: 'defendant',
        is_primary: false,
      },
      {
        case_id: CASE_IDS.johnson,
        contact_id: getContactId('jwilliams@williamshart.com'),
        role: 'opposing_counsel',
        is_primary: false,
      },
      {
        case_id: CASE_IDS.williams,
        contact_id: getContactId('Williams Family Trust'),
        role: 'petitioner',
        is_primary: true,
      },
      {
        case_id: CASE_IDS.martinez,
        contact_id: getContactId('elena.m@email.com'),
        role: 'petitioner',
        is_primary: true,
      },
      {
        case_id: CASE_IDS.martinez,
        contact_id: getContactId('rgarcia@garcialaw.com'),
        role: 'opposing_counsel',
        is_primary: false,
      },
      {
        case_id: CASE_IDS.davis,
        contact_id: getContactId('mdavis@email.com'),
        role: 'defendant',
        is_primary: true,
      },
      {
        case_id: CASE_IDS.techstart,
        contact_id: getContactId('amanda@techstart.io'),
        role: 'plaintiff',
        is_primary: true,
      },
      {
        case_id: CASE_IDS.techstart,
        contact_id: getContactId('DataFlow Solutions LLC'),
        role: 'defendant',
        is_primary: false,
      },
      {
        case_id: CASE_IDS.techstart,
        contact_id: getContactId('kmorrison@morrisonreed.com'),
        role: 'opposing_counsel',
        is_primary: false,
      },
    ].filter((cc) => cc.contact_id); // Filter out any null contact IDs

    for (const caseContact of caseContacts) {
      const { error } = await supabase.from('case_contacts').upsert(caseContact, {
        onConflict: 'case_id,contact_id',
      });
      if (error) throw error;
    }
    console.log('✅ Case contacts linked\n');

    // 6. Create Case Teams
    console.log('Creating case teams...');
    const caseTeams = [
      { case_id: CASE_IDS.johnson, user_id: USER_IDS.sarah, role: 'Lead Attorney', billing_rate: '450.00' },
      { case_id: CASE_IDS.johnson, user_id: USER_IDS.maria, role: 'Associate', billing_rate: '275.00' },
      { case_id: CASE_IDS.johnson, user_id: USER_IDS.jennifer, role: 'Paralegal', billing_rate: '150.00' },
      { case_id: CASE_IDS.williams, user_id: USER_IDS.david, role: 'Lead Attorney', billing_rate: '350.00' },
      { case_id: CASE_IDS.martinez, user_id: USER_IDS.maria, role: 'Lead Attorney', billing_rate: '275.00' },
      { case_id: CASE_IDS.davis, user_id: USER_IDS.sarah, role: 'Lead Attorney', billing_rate: '450.00' },
      { case_id: CASE_IDS.techstart, user_id: USER_IDS.david, role: 'Lead Attorney', billing_rate: '350.00' },
    ];

    for (const team of caseTeams) {
      const { error } = await supabase.from('case_team').upsert(team, { onConflict: 'case_id,user_id' });
      if (error) throw error;
    }
    console.log('✅ Case teams created\n');

    // 7. Create Discovery Requests (Johnson case)
    console.log('Creating discovery requests...');
    const discoveryRequests = [
      {
        case_id: CASE_IDS.johnson,
        type: 'interrogatory',
        title: 'First Set of Interrogatories to Defendant',
        description: '25 interrogatories regarding machine maintenance, safety protocols, and incident history',
        request_number: 'DIS-001',
        is_outgoing: true,
        from_party_id: getContactId('robert.johnson@email.com'),
        to_party_id: getContactId('ABC Manufacturing Corp.'),
        served_date: '2024-04-10T00:00:00Z',
        due_date: '2024-05-10T00:00:00Z',
        response_date: '2024-05-08T00:00:00Z',
        status: 'response_received',
        assigned_to_id: USER_IDS.maria,
      },
      {
        case_id: CASE_IDS.johnson,
        type: 'rfp',
        title: 'First Request for Production of Documents',
        description:
          '35 document requests including maintenance records, safety training records, OSHA reports, and incident reports',
        request_number: 'DIS-002',
        is_outgoing: true,
        from_party_id: getContactId('robert.johnson@email.com'),
        to_party_id: getContactId('ABC Manufacturing Corp.'),
        served_date: '2024-04-10T00:00:00Z',
        due_date: '2024-05-10T00:00:00Z',
        status: 'response_received',
        assigned_to_id: USER_IDS.jennifer,
      },
      {
        case_id: CASE_IDS.johnson,
        type: 'rfa',
        title: 'Requests for Admission',
        description: '15 requests for admission regarding machine condition and safety',
        request_number: 'DIS-003',
        is_outgoing: true,
        from_party_id: getContactId('robert.johnson@email.com'),
        to_party_id: getContactId('ABC Manufacturing Corp.'),
        served_date: '2024-05-20T00:00:00Z',
        due_date: '2024-06-19T00:00:00Z',
        status: 'response_due',
        assigned_to_id: USER_IDS.maria,
      },
      {
        case_id: CASE_IDS.johnson,
        type: 'interrogatory',
        title: "Defendant's First Set of Interrogatories to Plaintiff",
        description: '20 interrogatories regarding medical history, employment, and prior injuries',
        request_number: 'DIS-004',
        is_outgoing: false,
        from_party_id: getContactId('ABC Manufacturing Corp.'),
        to_party_id: getContactId('robert.johnson@email.com'),
        served_date: '2024-04-25T00:00:00Z',
        due_date: '2024-05-25T00:00:00Z',
        response_date: '2024-05-23T00:00:00Z',
        status: 'completed',
        assigned_to_id: USER_IDS.maria,
      },
      {
        case_id: CASE_IDS.johnson,
        type: 'rfp',
        title: "Defendant's Request for Production",
        description: 'Medical records, employment history, prior injuries',
        request_number: 'DIS-005',
        is_outgoing: false,
        from_party_id: getContactId('ABC Manufacturing Corp.'),
        to_party_id: getContactId('robert.johnson@email.com'),
        served_date: '2024-04-25T00:00:00Z',
        due_date: '2024-12-13T00:00:00Z',
        status: 'response_due',
        assigned_to_id: USER_IDS.jennifer,
      },
    ];

    const discoveryResults = [];
    for (const dr of discoveryRequests) {
      const { data, error } = await supabase.from('discovery_requests').insert(dr).select().single();
      if (error) throw error;
      discoveryResults.push(data);
    }
    console.log('✅ Discovery requests created\n');

    // 8. Create Discovery Items
    console.log('Creating discovery items...');
    const discoveryItems = [];
    const firstInterrogatory = discoveryResults.find((dr) => dr.request_number === 'DIS-001');
    if (firstInterrogatory) {
      for (let i = 1; i <= 25; i++) {
        discoveryItems.push({
          request_id: firstInterrogatory.id,
          item_number: i,
          text: `Interrogatory ${i}: Please state [question related to machine maintenance, safety, or incident]`,
          status: i <= 20 ? 'answered' : 'pending',
        });
      }
    }
    const rfp = discoveryResults.find((dr) => dr.request_number === 'DIS-002');
    if (rfp) {
      const rfpItems = [
        'All maintenance records for Machine #4472 from January 1, 2019 to present',
        'All employee safety training records for the past 5 years',
        'All OSHA inspection reports from the past 5 years',
        'All incident reports involving Machine #4472 from the past 5 years',
        'All safety protocols and procedures related to Machine #4472',
      ];
      rfpItems.forEach((text, idx) => {
        discoveryItems.push({
          request_id: rfp.id,
          item_number: idx + 1,
          text,
          status: idx < 4 ? 'received' : 'pending',
        });
      });
    }

    for (const item of discoveryItems) {
      const { error } = await supabase.from('discovery_items').insert(item);
      if (error) throw error;
    }
    console.log('✅ Discovery items created\n');

    // 9. Create Documents (Johnson case)
    console.log('Creating documents...');
    const documents = [
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Initial Client Intake Documents',
        original_name: 'intake_packet.pdf',
        storage_path: 'documents/johnson/intake_packet.pdf',
        description: 'Client intake forms, retainer agreement, and initial case assessment',
        bates_start: 'JOHNSON-000001',
        bates_end: 'JOHNSON-000045',
        page_count: 45,
        status: 'final',
        category: 'Intake',
        uploaded_by_id: USER_IDS.michael,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Medical Records - Houston Methodist',
        original_name: 'houston_methodist_records.pdf',
        storage_path: 'documents/johnson/houston_methodist_records.pdf',
        description: 'Complete medical records from Houston Methodist Hospital',
        bates_start: 'JOHNSON-000046',
        bates_end: 'JOHNSON-000089',
        page_count: 44,
        status: 'final',
        category: 'Medical Records',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Medical Records - Dr. Chen',
        original_name: 'dr_chen_records.pdf',
        storage_path: 'documents/johnson/dr_chen_records.pdf',
        description: 'Orthopedic surgeon records and surgical reports',
        bates_start: 'JOHNSON-000090',
        bates_end: 'JOHNSON-000112',
        page_count: 23,
        status: 'final',
        category: 'Medical Records',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Employment Records',
        original_name: 'employment_records.pdf',
        storage_path: 'documents/johnson/employment_records.pdf',
        description: 'Employment history, pay stubs, and benefits information',
        bates_start: 'JOHNSON-000113',
        bates_end: 'JOHNSON-000156',
        page_count: 44,
        status: 'final',
        category: 'Employment',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Machine Maintenance Records (from ABC)',
        original_name: 'maintenance_records.pdf',
        storage_path: 'documents/johnson/maintenance_records.pdf',
        description: 'Production documents received from opposing party',
        bates_start: 'JOHNSON-000157',
        bates_end: 'JOHNSON-000201',
        page_count: 45,
        status: 'final',
        category: 'Discovery',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'OSHA Reports',
        original_name: 'osha_reports.pdf',
        storage_path: 'documents/johnson/osha_reports.pdf',
        description: 'OSHA inspection and violation reports',
        bates_start: 'JOHNSON-000202',
        bates_end: 'JOHNSON-000215',
        page_count: 14,
        status: 'final',
        category: 'Discovery',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Photographs of Injury/Machine',
        original_name: 'photos.zip',
        storage_path: 'documents/johnson/photos.zip',
        description: 'Photographic evidence of injury and machine condition',
        bates_start: 'JOHNSON-000216',
        bates_end: 'JOHNSON-000234',
        page_count: 19,
        status: 'final',
        category: 'Evidence',
        uploaded_by_id: USER_IDS.jennifer,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Correspondence with Opposing Counsel',
        original_name: 'correspondence.pdf',
        storage_path: 'documents/johnson/correspondence.pdf',
        description: 'Email correspondence and letters with Williams & Hart LLP',
        bates_start: 'JOHNSON-000235',
        bates_end: 'JOHNSON-000267',
        page_count: 33,
        status: 'final',
        category: 'Correspondence',
        uploaded_by_id: USER_IDS.michael,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Expert Report - Dr. Chen',
        original_name: 'expert_report_chen.pdf',
        storage_path: 'documents/johnson/expert_report_chen.pdf',
        description: 'Expert medical report from Dr. Michael Chen',
        bates_start: 'JOHNSON-000268',
        bates_end: 'JOHNSON-000289',
        page_count: 22,
        status: 'final',
        category: 'Expert Reports',
        uploaded_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        name: 'Wage Loss Documentation',
        original_name: 'wage_loss.pdf',
        storage_path: 'documents/johnson/wage_loss.pdf',
        description: 'Documentation of lost wages and earning capacity',
        bates_start: 'JOHNSON-000290',
        bates_end: 'JOHNSON-000310',
        page_count: 21,
        status: 'final',
        category: 'Damages',
        uploaded_by_id: USER_IDS.jennifer,
      },
    ];

    for (const doc of documents) {
      const { error } = await supabase.from('documents').insert(doc);
      if (error) throw error;
    }
    console.log('✅ Documents created\n');

    // 10. Create Time Entries (Last 30 days, Johnson case)
    console.log('Creating time entries...');
    const timeEntries = [
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.sarah,
        date: '2024-12-02T00:00:00Z',
        hours: '1.50',
        rate: '450.00',
        amount: '675.00',
        description: 'Review medical records update from Dr. Chen',
        activity_code: 'review',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.jennifer,
        date: '2024-12-02T00:00:00Z',
        hours: '3.00',
        rate: '150.00',
        amount: '450.00',
        description: 'Organize production documents, apply Bates numbers',
        activity_code: 'admin',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.sarah,
        date: '2024-12-01T00:00:00Z',
        hours: '0.75',
        rate: '450.00',
        amount: '337.50',
        description: 'Conference call with expert witness Dr. Chen',
        activity_code: 'meeting',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.maria,
        date: '2024-11-30T00:00:00Z',
        hours: '4.50',
        rate: '275.00',
        amount: '1237.50',
        description: "Draft responses to Defendant's Second Interrogatories",
        activity_code: 'drafting',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.jennifer,
        date: '2024-11-29T00:00:00Z',
        hours: '2.00',
        rate: '150.00',
        amount: '300.00',
        description: 'Prepare discovery index and tracking spreadsheet',
        activity_code: 'admin',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.david,
        date: '2024-11-28T00:00:00Z',
        hours: '3.50',
        rate: '350.00',
        amount: '1225.00',
        description: 'Legal research re: employer liability for machine defects',
        activity_code: 'research',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.sarah,
        date: '2024-11-27T00:00:00Z',
        hours: '6.00',
        rate: '450.00',
        amount: '2700.00',
        description: 'Prepare for and attend deposition of plant manager',
        activity_code: 'deposition',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.jennifer,
        date: '2024-11-26T00:00:00Z',
        hours: '1.50',
        rate: '150.00',
        amount: '225.00',
        description: 'Schedule depositions, coordinate with court reporter',
        activity_code: 'admin',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.sarah,
        date: '2024-11-25T00:00:00Z',
        hours: '1.00',
        rate: '450.00',
        amount: '450.00',
        description: 'Client meeting to review case status',
        activity_code: 'meeting',
        is_billable: true,
        is_billed: false,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        user_id: USER_IDS.maria,
        date: '2024-11-22T00:00:00Z',
        hours: '5.00',
        rate: '275.00',
        amount: '1375.00',
        description: "Review and summarize defendant's production",
        activity_code: 'review',
        is_billable: true,
        is_billed: false,
      },
    ];

    for (const entry of timeEntries) {
      const { error } = await supabase.from('time_entries').insert(entry);
      if (error) throw error;
    }
    console.log('✅ Time entries created\n');

    // 11. Create Invoices
    console.log('Creating invoices...');
    const williamsContact = getContactId('Williams Family Trust');
    const martinezContact = getContactId('elena.m@email.com');
    const techstartContact = getContactId('amanda@techstart.io');

    const invoices = [
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.williams,
        contact_id: williamsContact,
        invoice_number: '2024-0089',
        status: 'paid',
        issue_date: '2024-11-01T00:00:00Z',
        due_date: '2024-11-16T00:00:00Z',
        subtotal: '8750.00',
        tax: '0.00',
        discount: '0.00',
        total: '8750.00',
        amount_paid: '8750.00',
        balance: '0.00',
        terms: 'Net 15',
        sent_at: '2024-11-01T00:00:00Z',
        viewed_at: '2024-11-02T00:00:00Z',
        paid_at: '2024-11-15T00:00:00Z',
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.martinez,
        contact_id: martinezContact,
        invoice_number: '2024-0095',
        status: 'viewed',
        issue_date: '2024-11-15T00:00:00Z',
        due_date: '2024-12-15T00:00:00Z',
        subtotal: '12450.00',
        tax: '0.00',
        discount: '0.00',
        total: '12450.00',
        amount_paid: '0.00',
        balance: '12450.00',
        terms: 'Net 30',
        sent_at: '2024-11-15T00:00:00Z',
        viewed_at: '2024-11-16T00:00:00Z',
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.techstart,
        contact_id: techstartContact,
        invoice_number: '2024-0101',
        status: 'draft',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: '24875.00',
        tax: '0.00',
        discount: '0.00',
        total: '24875.00',
        amount_paid: '0.00',
        balance: '24875.00',
        terms: 'Net 30',
      },
    ];

    const invoiceResults = [];
    for (const invoice of invoices) {
      const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
      if (error) throw error;
      invoiceResults.push(data);
    }
    console.log('✅ Invoices created\n');

    // 12. Create Payments
    console.log('Creating payments...');
    const williamsInvoice = invoiceResults.find((inv) => inv.invoice_number === '2024-0089');
    if (williamsInvoice) {
      const { error } = await supabase.from('payments').insert({
        firm_id: FIRM_ID,
        invoice_id: williamsInvoice.id,
        contact_id: williamsContact,
        amount: '8750.00',
        method: 'check',
        reference: 'Check #4521',
        received_date: '2024-11-15T00:00:00Z',
        deposited_date: '2024-11-16T00:00:00Z',
      });
      if (error) throw error;
    }
    console.log('✅ Payments created\n');

    // 13. Create Calendar Events
    console.log('Creating calendar events...');
    const events = [
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Deposition of James Miller (ABC Plant Manager)',
        description: 'Deposition of plant manager regarding machine maintenance and safety protocols',
        type: 'deposition',
        start_date: '2024-12-05T09:00:00Z',
        end_date: '2024-12-05T17:00:00Z',
        all_day: false,
        is_court_deadline: false,
        created_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Discovery Response Due',
        description: "Defendant's Request for Production response due",
        type: 'deadline',
        start_date: '2024-12-09T00:00:00Z',
        end_date: '2024-12-09T23:59:59Z',
        all_day: true,
        is_court_deadline: true,
        created_by_id: USER_IDS.maria,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.martinez,
        title: 'Status Conference - Martinez v. Martinez',
        description: 'Status conference with Judge Torres',
        type: 'court_date',
        start_date: '2024-12-12T14:00:00Z',
        end_date: '2024-12-12T15:00:00Z',
        all_day: false,
        is_court_deadline: false,
        created_by_id: USER_IDS.maria,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.martinez,
        title: 'Invoice Due - Martinez case',
        description: 'Invoice #2024-0095 payment due',
        type: 'deadline',
        start_date: '2024-12-15T00:00:00Z',
        end_date: '2024-12-15T23:59:59Z',
        all_day: true,
        is_court_deadline: false,
        created_by_id: USER_IDS.michael,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.williams,
        title: 'Client Meeting - Williams Estate',
        description: 'Quarterly estate administration review meeting',
        type: 'meeting',
        start_date: '2024-12-18T10:00:00Z',
        end_date: '2024-12-18T11:30:00Z',
        all_day: false,
        is_court_deadline: false,
        created_by_id: USER_IDS.david,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.techstart,
        title: 'Discovery Cutoff - TechStart case',
        description: 'Final discovery cutoff date',
        type: 'deadline',
        start_date: '2024-12-20T00:00:00Z',
        end_date: '2024-12-20T23:59:59Z',
        all_day: true,
        is_court_deadline: true,
        created_by_id: USER_IDS.david,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Motion Hearing - Johnson case',
        description: 'Hearing on motion for summary judgment',
        type: 'hearing',
        start_date: '2025-01-08T09:00:00Z',
        end_date: '2025-01-08T12:00:00Z',
        all_day: false,
        is_court_deadline: true,
        created_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.techstart,
        title: 'Trial Date - TechStart case',
        description: 'Jury trial scheduled',
        type: 'trial',
        start_date: '2025-03-03T09:00:00Z',
        end_date: '2025-03-07T17:00:00Z',
        all_day: false,
        is_court_deadline: true,
        created_by_id: USER_IDS.david,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Trial Date - Johnson case',
        description: 'Jury trial scheduled',
        type: 'trial',
        start_date: '2025-09-15T09:00:00Z',
        end_date: '2025-09-19T17:00:00Z',
        all_day: false,
        is_court_deadline: true,
        created_by_id: USER_IDS.sarah,
      },
    ];

    for (const event of events) {
      const { error } = await supabase.from('events').insert(event);
      if (error) throw error;
    }
    console.log('✅ Calendar events created\n');

    // 14. Create Tasks
    console.log('Creating tasks...');
    const tasks = [
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Review and finalize discovery responses',
        description: 'Review all discovery responses before filing deadline',
        status: 'pending',
        priority: 'high',
        due_date: '2024-12-08T00:00:00Z',
        assigned_to_id: USER_IDS.maria,
        created_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Prepare deposition outline for James Miller',
        description: 'Prepare detailed outline for plant manager deposition',
        status: 'in_progress',
        priority: 'urgent',
        due_date: '2024-12-04T00:00:00Z',
        assigned_to_id: USER_IDS.sarah,
        created_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Order medical records from Southwest Orthopedics',
        description: 'Request updated medical records from Southwest Orthopedics',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-12-10T00:00:00Z',
        assigned_to_id: USER_IDS.jennifer,
        created_by_id: USER_IDS.maria,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.techstart,
        title: 'Draft motion for protective order',
        description: 'Draft motion to protect confidential business information',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-12-15T00:00:00Z',
        assigned_to_id: USER_IDS.david,
        created_by_id: USER_IDS.david,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.johnson,
        title: 'Schedule expert deposition - Dr. Chen',
        description: 'Coordinate with opposing counsel to schedule Dr. Chen deposition',
        status: 'pending',
        priority: 'low',
        due_date: '2024-12-20T00:00:00Z',
        assigned_to_id: USER_IDS.jennifer,
        created_by_id: USER_IDS.sarah,
      },
      {
        firm_id: FIRM_ID,
        case_id: CASE_IDS.martinez,
        title: 'Finalize property division spreadsheet',
        description: 'Complete property division spreadsheet for mediation',
        status: 'in_progress',
        priority: 'high',
        due_date: '2024-12-12T00:00:00Z',
        assigned_to_id: USER_IDS.maria,
        created_by_id: USER_IDS.maria,
      },
    ];

    for (const task of tasks) {
      const { error } = await supabase.from('tasks').insert(task);
      if (error) throw error;
    }
    console.log('✅ Tasks created\n');

    // 15. Create Trust Account
    console.log('Creating trust account...');
    const { data: trustAccount, error: trustError } = await supabase
      .from('trust_accounts')
      .insert({
        firm_id: FIRM_ID,
        name: 'Mitchell & Associates IOLTA Account',
        bank_name: 'Chase Bank',
        account_number: '****1234',
        balance: '127450.00',
      })
      .select()
      .single();

    if (trustError) throw trustError;
    console.log('✅ Trust account created\n');

    // 16. Create Trust Transactions
    console.log('Creating trust transactions...');
    const trustTransactions = [
      {
        trust_account_id: trustAccount.id,
        case_id: CASE_IDS.martinez,
        contact_id: martinezContact,
        type: 'deposit',
        amount: '10000.00',
        running_balance: '127450.00',
        description: 'Martinez Retainer',
        date: '2024-11-20T00:00:00Z',
      },
      {
        trust_account_id: trustAccount.id,
        case_id: CASE_IDS.johnson,
        contact_id: getContactId('robert.johnson@email.com'),
        type: 'withdrawal',
        amount: '-450.00',
        running_balance: '117450.00',
        description: 'Filing Fee (Johnson case)',
        date: '2024-11-15T00:00:00Z',
      },
      {
        trust_account_id: trustAccount.id,
        case_id: CASE_IDS.techstart,
        contact_id: techstartContact,
        type: 'deposit',
        amount: '25000.00',
        running_balance: '117900.00',
        description: 'TechStart Retainer',
        date: '2024-11-10T00:00:00Z',
      },
      {
        trust_account_id: trustAccount.id,
        case_id: CASE_IDS.williams,
        contact_id: williamsContact,
        type: 'transfer',
        amount: '-8750.00',
        running_balance: '142900.00',
        description: 'Transfer to Operating - Williams Invoice Payment',
        date: '2024-11-05T00:00:00Z',
      },
    ];

    for (const transaction of trustTransactions) {
      const { error } = await supabase.from('trust_transactions').insert(transaction);
      if (error) throw error;
    }
    console.log('✅ Trust transactions created\n');

    console.log('🎉 Seed completed successfully!\n');
    console.log('Demo data for Mitchell & Associates, P.C. has been created.');
    console.log('\nYou can now log in with any of the user emails:');
    console.log('- sarah@mitchelllaw.com');
    console.log('- david@mitchelllaw.com');
    console.log('- maria@mitchelllaw.com');
    console.log('- jennifer@mitchelllaw.com');
    console.log('- michael@mitchelllaw.com');
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seed();

