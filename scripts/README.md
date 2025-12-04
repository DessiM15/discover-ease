# Seed Script

This seed script creates realistic, professional demo data for DiscoverEase that can be shown to potential law firm clients.

## Setup

1. Make sure your `.env.local` file has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` for full access)

2. Run the seed script:
   ```bash
   npm run seed
   ```

## What Gets Created

The script creates a complete demo environment for **Mitchell & Associates, P.C.**:

### Firm
- Full-service litigation firm in Houston, TX
- 5 team members with different roles and billing rates

### Cases (5 realistic cases)
1. **Johnson v. ABC Manufacturing Corp.** - Personal Injury (Workplace Accident)
2. **Estate of Williams** - Estate Planning / Probate
3. **Martinez v. Martinez** - Family Law (Divorce)
4. **State v. Davis** - Criminal Defense (DWI)
5. **TechStart Inc. v. DataFlow Solutions** - Contract Dispute / Business Litigation

### Contacts
- Clients, opposing parties, opposing counsel, and expert witnesses
- All properly linked to cases

### Discovery
- Multiple discovery requests (interrogatories, RFPs, RFAs)
- Both incoming and outgoing requests
- Discovery items with realistic statuses

### Documents
- 10 documents for the Johnson case with proper Bates numbering
- Realistic document categories and descriptions

### Time Entries
- 10 time entries from the last 30 days
- Various activities: research, drafting, meetings, depositions
- Proper billing rates and amounts

### Invoices
- 3 invoices with different statuses (paid, viewed, draft)
- Realistic amounts and payment terms

### Calendar Events
- 9 calendar events including depositions, deadlines, hearings, and trial dates
- Properly linked to cases

### Tasks
- 6 tasks with different priorities and due dates
- Assigned to appropriate team members

### Trust Account
- IOLTA account with realistic balance
- 4 trust transactions (deposits, withdrawals, transfers)

## Notes

- The script uses `upsert` operations, so it's safe to run multiple times
- All data is interconnected and realistic
- Uses proper legal terminology and realistic timelines
- Fixed UUIDs ensure consistency across runs

