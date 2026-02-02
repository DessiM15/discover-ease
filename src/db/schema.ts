import { pgTable, uuid, text, timestamp, decimal, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'attorney', 'paralegal', 'secretary', 'billing']);
export const contactTypeEnum = pgEnum('contact_type', ['client', 'opposing_party', 'opposing_counsel', 'witness', 'expert', 'vendor', 'court', 'other']);
export const caseTypeEnum = pgEnum('case_type', ['personal_injury', 'medical_malpractice', 'family_law', 'divorce', 'criminal_defense', 'employment', 'real_estate', 'contract_dispute', 'immigration', 'bankruptcy', 'estate_planning', 'other']);
export const caseStatusEnum = pgEnum('case_status', ['intake', 'active', 'pending', 'on_hold', 'closed', 'archived']);
export const billingTypeEnum = pgEnum('billing_type', ['hourly', 'flat_fee', 'contingency', 'hybrid']);
export const caseContactRoleEnum = pgEnum('case_contact_role', ['plaintiff', 'defendant', 'petitioner', 'respondent', 'third_party']);
export const documentStatusEnum = pgEnum('document_status', ['draft', 'pending_review', 'reviewed', 'final', 'filed', 'served']);
export const discoveryRequestTypeEnum = pgEnum('discovery_request_type', ['interrogatory', 'rfp', 'rfa', 'subpoena', 'deposition_notice', 'other']);
export const discoveryRequestStatusEnum = pgEnum('discovery_request_status', ['draft', 'served', 'response_due', 'response_received', 'objection_filed', 'completed', 'overdue']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void']);
export const paymentMethodEnum = pgEnum('payment_method', ['credit_card', 'ach', 'check', 'cash', 'trust']);
export const eventTypeEnum = pgEnum('event_type', ['deadline', 'court_date', 'meeting', 'deposition', 'hearing', 'trial', 'reminder', 'other']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const messageTypeEnum = pgEnum('message_type', ['email', 'sms', 'portal_message', 'internal_note']);
export const messageDirectionEnum = pgEnum('message_direction', ['inbound', 'outbound']);

// Firms table
export const firms = pgTable('firms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  timezone: text('timezone').default('America/New_York'),
  defaultBillingRate: decimal('default_billing_rate', { precision: 10, scale: 2 }),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionTier: text('subscription_tier'),
  subscriptionStatus: text('subscription_status'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  title: text('title'),
  phone: text('phone'),
  barNumber: text('bar_number'),
  billingRate: decimal('billing_rate', { precision: 10, scale: 2 }),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  type: contactTypeEnum('type').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  companyName: text('company_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  portalToken: text('portal_token'),
  portalEnabled: boolean('portal_enabled').default(false).notNull(),
  tags: text('tags').array(),
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cases table
export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseNumber: text('case_number').notNull(),
  name: text('name').notNull(),
  type: caseTypeEnum('type').notNull(),
  status: caseStatusEnum('status').notNull(),
  description: text('description'),
  court: text('court'),
  judge: text('judge'),
  courtCaseNumber: text('court_case_number'),
  jurisdiction: text('jurisdiction'),
  dateOpened: timestamp('date_opened'),
  dateClosed: timestamp('date_closed'),
  statuteOfLimitations: timestamp('statute_of_limitations'),
  trialDate: timestamp('trial_date'),
  discoveryCutoff: timestamp('discovery_cutoff'),
  billingType: billingTypeEnum('billing_type'),
  billingRate: decimal('billing_rate', { precision: 10, scale: 2 }),
  batesPrefix: text('bates_prefix'),
  currentBatesNumber: integer('current_bates_number').default(0),
  leadAttorneyId: uuid('lead_attorney_id').references(() => users.id),
  practiceArea: text('practice_area'),
  referralSource: text('referral_source'),
  tags: text('tags').array(),
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Case Contacts table
export const caseContacts = pgTable('case_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  role: caseContactRoleEnum('role').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Case Team table
export const caseTeam = pgTable('case_team', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role'),
  billingRate: decimal('billing_rate', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Document Folders table
export const documentFolders = pgTable('document_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => documentFolders.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  description: text('description'),
  storagePath: text('storage_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  batesStart: text('bates_start'),
  batesEnd: text('bates_end'),
  pageCount: integer('page_count'),
  status: documentStatusEnum('status').default('draft').notNull(),
  version: integer('version').default(1).notNull(),
  isTemplate: boolean('is_template').default(false).notNull(),
  category: text('category'),
  tags: text('tags').array(),
  ocrText: text('ocr_text'),
  aiSummary: text('ai_summary'),
  uploadedById: uuid('uploaded_by_id').references(() => users.id),
  reviewedById: uuid('reviewed_by_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Discovery Requests table
export const discoveryRequests = pgTable('discovery_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  type: discoveryRequestTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  requestNumber: text('request_number'),
  isOutgoing: boolean('is_outgoing').default(true).notNull(),
  fromPartyId: uuid('from_party_id').references(() => contacts.id),
  toPartyId: uuid('to_party_id').references(() => contacts.id),
  servedDate: timestamp('served_date'),
  dueDate: timestamp('due_date'),
  responseDate: timestamp('response_date'),
  status: discoveryRequestStatusEnum('status').default('draft').notNull(),
  responseText: text('response_text'),
  objections: text('objections'),
  aiDraftResponse: text('ai_draft_response'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Discovery Items table
export const discoveryItems = pgTable('discovery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => discoveryRequests.id, { onDelete: 'cascade' }).notNull(),
  itemNumber: integer('item_number').notNull(),
  text: text('text').notNull(),
  responseText: text('response_text'),
  objectionText: text('objection_text'),
  status: text('status'),
  aiDraftResponse: text('ai_draft_response'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Production Sets table
export const productionSets = pgTable('production_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  batesPrefix: text('bates_prefix'),
  batesStart: text('bates_start'),
  batesEnd: text('bates_end'),
  producedDate: timestamp('produced_date'),
  producedToId: uuid('produced_to_id').references(() => contacts.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Production Documents table
export const productionDocuments = pgTable('production_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionSetId: uuid('production_set_id').references(() => productionSets.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  batesNumber: text('bates_number'),
  isPrivileged: boolean('is_privileged').default(false).notNull(),
  privilegeReason: text('privilege_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Privilege Log table
export const privilegeLog = pgTable('privilege_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  batesNumber: text('bates_number'),
  documentDate: timestamp('document_date'),
  author: text('author'),
  recipients: text('recipients').array(),
  description: text('description'),
  privilegeType: text('privilege_type'),
  basis: text('basis'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Time Entries table
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  hours: decimal('hours', { precision: 10, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  activityCode: text('activity_code'),
  isBillable: boolean('is_billable').default(true).notNull(),
  isBilled: boolean('is_billed').default(false).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  category: text('category'),
  vendor: text('vendor'),
  receiptPath: text('receipt_path'),
  isBillable: boolean('is_billable').default(true).notNull(),
  isBilled: boolean('is_billed').default(false).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0'),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull(),
  terms: text('terms'),
  notes: text('notes'),
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  paidAt: timestamp('paid_at'),
  stripeInvoiceId: text('stripe_invoice_id'),
  paymentLink: text('payment_link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  reference: text('reference'),
  stripePaymentId: text('stripe_payment_id'),
  receivedDate: timestamp('received_date').notNull(),
  depositedDate: timestamp('deposited_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trust Accounts table
export const trustAccounts = pgTable('trust_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trust Transactions table
export const trustTransactions = pgTable('trust_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  trustAccountId: uuid('trust_account_id').references(() => trustAccounts.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // deposit, withdrawal, transfer
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  runningBalance: decimal('running_balance', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  reference: text('reference'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: eventTypeEnum('type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  allDay: boolean('all_day').default(false).notNull(),
  location: text('location'),
  videoLink: text('video_link'),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrenceRule: text('recurrence_rule'),
  isCourtDeadline: boolean('is_court_deadline').default(false).notNull(),
  reminderMinutes: integer('reminder_minutes').array(),
  color: text('color'),
  googleEventId: text('google_event_id'),
  outlookEventId: text('outlook_event_id'),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  type: messageTypeEnum('type').notNull(),
  direction: messageDirectionEnum('direction').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  fromEmail: text('from_email'),
  toEmail: text('to_email'),
  fromPhone: text('from_phone'),
  toPhone: text('to_phone'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  sentById: uuid('sent_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leads table
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  source: text('source'),
  status: text('status'),
  caseType: text('case_type'),
  description: text('description'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  convertedToCaseId: uuid('converted_to_case_id').references(() => cases.id),
  convertedToContactId: uuid('converted_to_contact_id').references(() => contacts.id),
  intakeFormData: jsonb('intake_form_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflows table
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  caseType: text('case_type'),
  trigger: text('trigger'),
  isActive: boolean('is_active').default(true).notNull(),
  steps: jsonb('steps'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activity Log table
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Team Invites table
export const teamInvites = pgTable('team_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull(),
  invitedById: uuid('invited_by_id').references(() => users.id),
  token: text('token').notNull().unique(),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  lastSentAt: timestamp('last_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Calendar Integrations table
export const calendarIntegrations = pgTable('calendar_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  calendarId: text('calendar_id').default('primary'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Calendar Shares table
export const calendarShares = pgTable('calendar_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sharedWithUserId: uuid('shared_with_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permissions: text('permissions').default('read').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Integrations table (Slack, Teams, etc.)
export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  webhookUrl: text('webhook_url'),
  teamId: text('team_id'),
  teamName: text('team_name'),
  defaultChannel: text('default_channel'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow Executions table
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  firmId: uuid('firm_id').references(() => firms.id, { onDelete: 'cascade' }).notNull(),
  triggerEvent: jsonb('trigger_event'),
  status: text('status').default('running').notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Scheduled Workflow Steps table
export const scheduledWorkflowSteps = pgTable('scheduled_workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  stepId: text('step_id').notNull(),
  eventData: jsonb('event_data').notNull(),
  executeAt: timestamp('execute_at').notNull(),
  executedAt: timestamp('executed_at'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Discovery Share Links table
export const discoveryShareLinks = pgTable('discovery_share_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => discoveryRequests.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  maxUploads: integer('max_uploads'),
  currentUploads: integer('current_uploads').default(0).notNull(),
  instructions: text('instructions'),
  isActive: boolean('is_active').default(true).notNull(),
  createdById: uuid('created_by_id').references(() => users.id),
  lastSentAt: timestamp('last_sent_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Discovery Uploads table
export const discoveryUploads = pgTable('discovery_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  shareLinkId: uuid('share_link_id').references(() => discoveryShareLinks.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  requestId: uuid('request_id').references(() => discoveryRequests.id, { onDelete: 'cascade' }).notNull(),
  uploaderName: text('uploader_name').notNull(),
  uploaderEmail: text('uploader_email').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Integrations table (personal email/calendar connections per user)
export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'microsoft' or 'google'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  email: text('email'), // Connected account email
  displayName: text('display_name'), // User's name from provider
  providerUserId: text('provider_user_id'), // User ID from Microsoft/Google
  picture: text('picture'), // Profile picture URL
  expiresAt: timestamp('expires_at'),
  scopes: text('scopes').array(), // Granted OAuth scopes
  isEmailEnabled: boolean('is_email_enabled').default(true).notNull(),
  isCalendarEnabled: boolean('is_calendar_enabled').default(true).notNull(),
  lastEmailSync: timestamp('last_email_sync'),
  lastCalendarSync: timestamp('last_calendar_sync'),
  syncSettings: jsonb('sync_settings'), // Custom sync preferences
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

