# MBA Membership System Redesign

## Full Lifecycle Architecture for User/Member Renewal

### Executive Summary

Current system conflates Orders (product purchases) with Applications (membership registration). This redesign establishes a proper multi-year membership lifecycle with persistent member records, annual membership renewals, division tracking, and entry prepayments.

---

## Current State (Problems)

- `Orders` table stores both products AND applications
- `productCategory` holds pipe-delimited application details (bloated, unsearchable)
- No persistent member record across years
- Renewal requires creating a new application
- No tracking of division history or membership status
- Hard to query "active members" or "member history"

---

## Proposed Architecture

### Core Tables

#### 1. **Members** (New)

Persistent user record, created once

```sql
- id (PK)
- email (UK) -- primary identifier
- firstName
- lastName
- phone
- address
- city
- postalCode
- gender
- coachingType (null | "Community" | "Competitive")
- createdAt
- updatedAt
```

**Purpose:** One member record per person, spans all years

---

#### 2. **Memberships** (New)

Annual membership record per member

```sql
- id (PK)
- memberId (FK → Members)
- year (e.g., 2026)
- status ("pending" | "active" | "expired" | "cancelled")
- totalAmount (DECIMAL)
- paidAmount (DECIMAL)
- paymentMethod (null | "cheque" | "cash" | "e-transfer")
- paymentDate
- notes
- createdAt
- updatedAt
- (UK: memberId + year)
```

**Purpose:** Track one membership per member per year; supports renewals

---

#### 3. **Divisions** (New)

Enum table for membership divisions

```sql
- id (PK)
- name ("Seniors" | "POA" | "Tournament")
- entryFee (DECIMAL)
- maxPrepayCount
- freeEntryThreshold
- createdAt
```

**Purpose:** Centralized division config; easier to adjust fees

---

#### 4. **MembershipDivisions** (New)

Join table: which divisions does this member's annual membership include?

```sql
- id (PK)
- membershipId (FK → Memberships)
- divisionId (FK → Divisions)
- divisionType ("Standard" | "1st Time Masters" | "Lifetime")
- divisionFee (DECIMAL)
- createdAt
- (UK: membershipId + divisionId)
```

**Purpose:** Member can join multiple divisions in one year; track fee per division

---

#### 5. **EntryPrepayments** (New)

Tournament entry prepayment tracking

```sql
- id (PK)
- membershipId (FK → Memberships)
- divisionId (FK → Divisions)
- prepayCount (INTEGER)
- entryFee (DECIMAL) -- locked at time of prepayment
- totalPrepayAmount (DECIMAL)
- discountAmount (DECIMAL) -- calculated: prepay for 5 get 1 free, etc.
- createdAt
- updatedAt
```

**Purpose:** Track prepaid entries per division; calculate discounts

---

#### 6. **MembershipApplications** (New)

Captures application state separately from membership

```sql
- id (PK)
- memberId (FK → Members, nullable for new applicants)
- membershipId (FK → Memberships, nullable until approved)
- email
- status ("draft" | "submitted" | "approved" | "rejected")
- selectedDivisions (JSON) -- {divisionId: type} for easy parsing
- totalAmount (DECIMAL)
- pdfUrl (STRING) -- path to generated PDF
- submittedAt
- reviewedAt
- reviewedBy (admin user, if implemented)
- rejectionReason (nullable)
- createdAt
- updatedAt
```

**Purpose:** Application workflow separate from actual membership; audit trail

---

#### 7. **Orders** (Refactored)

Pure product orders—shirts, merchandise, etc.

```sql
- id (PK)
- memberId (FK → Members, nullable for guest orders)
- productId (FK → Products)
- productType (STRING)
- productName (STRING)
- productSize (STRING)
- productCategory (STRING) -- VARCHAR(255) sufficient; no more pipe-delimited data
- quantity (INTEGER)
- totalAmount (DECIMAL)
- paymentMethod
- paymentDate
- status ("pending" | "paid" | "shipped" | "cancelled")
- createdAt
- updatedAt
```

**Purpose:** Clean separation—only product orders, no membership data

---

### Supporting Enums/Lookups

#### Division Types

- "Standard" - $275/$225 (Seniors), $275/$225 (POA), $285/$235 (Tournament)
- "1st Time Masters" - $225 (Seniors), $225 (POA), $235 (Tournament)
- "Lifetime" - $225/$225/$235

#### Payment Methods

- "cheque"
- "cash"
- "e-transfer"

#### Prepayment Discounts (Division-specific)

- Seniors/POA: prepay 5 entries → 1 free ($160 total)
- Tournament: prepay 6 entries → 1 free ($200 total)

---

## Data Flow & Lifecycle

### New Member Application → First Membership

1. User fills out form (firstName, lastName, email, divisions, etc.)
2. **MembershipApplication** created with status="draft"
3. User submits → status="submitted", PDF generated
4. Email sent to admin
5. Admin approves
6. **Members** record created (if new email)
7. **Memberships** record created (year=2026, status="active")
8. **MembershipDivisions** records created (one per selected division)
9. **EntryPrepayments** records created (if prepays selected)
10. Confirmation email sent to member

### Existing Member Renewal

1. Member logs in or re-applies for 2027
2. System detects existing **Members** record by email
3. **MembershipApplication** created with pre-filled data (firstName, address, etc.)
4. Member updates divisions/prepays
5. Submits → **MembershipApplications.status="submitted"**
6. Admin approves
7. **Memberships** record created for year=2027 (linked to existing Members)
8. Renewal confirmation sent

### Year Transition

- At Dec 31 yearly, batch job marks Memberships.status="expired" if not renewed
- Members record persists; can still query historical participation

---

## Migration Strategy

### Phase 1: Schema Creation (No Data Loss)

**Milestone 1.1:** Create new tables

- `Divisions` table with seed data
- `Members` table
- `Memberships` table
- `MembershipDivisions` table
- `EntryPrepayments` table
- `MembershipApplications` table

**Milestone 1.2:** Keep `Orders` unchanged but update column comments

- Note: `productCategory` only for product orders going forward

---

### Phase 2: API Refactor

**Milestone 2.1:** New endpoints

- `POST /api/applications` - submit new/renewal application
- `GET /api/applications/:id` - get application details
- `GET /api/members/me` - get member profile (requires auth if added)
- `GET /api/members/:id/memberships` - get member's yearly membership history

**Milestone 2.2:** Application approval workflow

- `PATCH /api/admin/applications/:id/approve`
- `PATCH /api/admin/applications/:id/reject`

**Milestone 2.3:** Membership endpoints

- `GET /api/memberships/:id` - get membership details
- `GET /api/memberships/:id/divisions` - get divisions for this membership
- `GET /api/memberships/:id/prepayments` - get entry prepayments

---

### Phase 3: Frontend Refactor

**Milestone 3.1:** Update form submission

- POST to `/api/applications` instead of `/api/orders`
- Response contains `applicationId` + `memberId` for tracking

**Milestone 3.2:** Update email service

- New template for MembershipApplications (cleaner data access)
- PDF generator uses structured division/prepayment data
- No more pipe-delimited parsing

**Milestone 3.3:** Update receipt/confirmation

- Pull data from Memberships + MembershipDivisions + EntryPrepayments
- Cleaner, more reliable rendering

---

### Phase 4: Admin UI (CRITICAL PATH - Required for Launch)

**Milestone 4.1:** Member management dashboard

- Search members by email, name, phone, postal code
- View membership history (all years)
- View current active memberships + divisions
- View entry prepayments + payment status
- Edit member contact info (address, phone, email)

**Milestone 4.2:** Application approval workflow

- Queue of pending applications (new + renewals)
- Approve/reject with optional notes
- Manual membership creation (backfill, corrections)
- Bulk import from CSV (emails + basic info)

**Milestone 4.3:** Year transition tools

- "Close season" button to expire all 2026 memberships
- "Open new year" button to create 2027 season
- Renewal pre-fill reminders

**Milestone 4.4:** Reporting

- Active members by division
- Revenue by division + year
- Duplicate/fraud detection flags

---

## Security & Anti-Abuse Strategy

### The Problem: Email-Only Identity Risk

Using email alone as the defining entity creates vulnerabilities:

1. **Account Hijacking**: Bad actor submits application under existing member's email (changes phone/address, steals membership)
2. **System Flooding**: Bots spam multiple applications with different variations of fake emails
3. **Duplicate Memberships**: Same person signs up multiple times to game discounts

### Proposed Mitigations

#### Tier 1: Application-Level Checks (v1 Launch)

1. **Duplicate Detection** on submit (before approval)
   - Check if email already exists in Members table
   - If exists: offer "Renewal" path with pre-filled data instead of "New" path
   - Flag as renewal, not new application
   - Prevents accidental re-signup of existing members
2. **Registration Window Gate** (Manual Admin Control)
   - Registration only open during specific periods (e.g., Aug 15 - Sept 5)
   - After deadline: toggle off and force PDF email submission
   - Simple + effective against bot flooding

**For v1.1 (if needed after observing traffic):**

- Email verification (6-digit code form)
- Rate limiting on applications endpoint
- CAPTCHA on form submission

#### Tier 2: Admin Verification (v1 Launch)

1. **Manual approval requirement** for all memberships (new + renewals)
   - Admin dashboard clearly flags: "New Member" vs "Renewal"
   - Simple human-in-loop check before approval
2. **Audit trail**: Log all membership changes (who approved, when, status transitions)
   - Tracks approval history for compliance/troubleshooting

#### Tier 3: Member Self-Service (Phase 6 - Future)

- Member login via **passwordless email code** (6-digit code + form, not yet implemented)
- See past memberships, payment history, entry results
- Submit renewal from authenticated session (trusted path)
- For future security hardening if traffic patterns change

### Implementation Priority

**For v1 Launch (Sept 7, 2026):**

- ✅ Duplicate detection (route to renewal path) — prevents accidental re-signup
- ✅ Manual admin approval for all memberships (human-in-loop control)
- ✅ Registration window toggle (admin can close registration after deadline, force email submission)
- ✅ Audit trail (approval history for compliance)

**For v1.1+ (After observing real usage patterns):**

- Email verification (6-digit code form)
- Rate limiting + CAPTCHA (if bot traffic appears)
- Member self-service portal with passwordless login

### Why This Works

- **Email compromise**: Postal code + renewal check catches it
- **Bot flooding**: Rate limiting + CAPTCHA + manual approval
- **Duplicate signups**: Duplicate detection routes repeat submitter to renewal path
- **Bad actor**: Can't do much without email access OR postal code match. Audit trail catches patterns.

---

## Benefits

| Aspect                 | Before                    | After                                     |
| ---------------------- | ------------------------- | ----------------------------------------- |
| **Member Persistence** | Lost after order          | Retained across years                     |
| **Renewal**            | Resubmit full form        | Pre-filled update                         |
| **Division Tracking**  | Pipe-delimited string     | Proper join table                         |
| **Entry Prepayments**  | Parsed from text          | Structured records                        |
| **Queries**            | Nearly impossible         | "Show all active Seniors members in 2026" |
| **Reporting**          | Manual export             | SQL queries                               |
| **Field Size Issues**  | productCategory overflows | Not a problem                             |
| **Audit Trail**        | None                      | MembershipApplications records            |

---

## Rollout Timeline (Estimated)

| Phase                  | Effort         | Timeline    | Note                                              |
| ---------------------- | -------------- | ----------- | ------------------------------------------------- |
| 1: Schema              | 2-3 hrs        | Day 1-2     | Core tables + Divisions seed data                 |
| 2: API                 | 4-5 hrs        | Day 2-4     | POST /applications, GET endpoints, basic approval |
| 3: Frontend refactor   | 2-3 hrs        | Day 4-5     | Update form to POST /applications                 |
| 4: Admin UI (parallel) | 6-8 hrs        | Day 2-6     | Approval queue, member search, year transition    |
| **Total**              | **~14-19 hrs** | **~1 week** | All phases compressed for Sept 7 launch           |

---

## Risk Mitigation

1. **Database backup** before creating new schema
2. **Test schema locally** before pushing to production
3. **Rollback plan**: Keep migration files in git history for quick schema revert if needed
4. **Gradual rollout**: Start with admin testing, then enable for users on Sept 7

---

## Decisions Locked In ✅

1. **Email verification:** Defer to v1.1 (6-digit code form, not for launch)
2. **Renewals:** Manual admin approval (not auto-approve)
3. **Postal code verification:** Not needed (small site, 3-year history, low attack surface)
4. **Multi-year prepayments:** Not supported (2027 entries must prepay in 2027 season)
5. **Bulk CSV import:** Future enhancement, not v1
6. **PIN Card tracking:** Not used (removed from Members schema)

---

## CRITICAL: Year Transition & Timing

**Today is Aug 31, 2026 (season transition day)** ⚡

- New bowling season starts after Labor Day (Sept 7, 2026)
- Old season (2026) ends TODAY
- This means:
  - Need admin tool to "close out" 2026 memberships
  - Need to create 2027 season memberships for renewals
  - New member signups should now be for 2027
  - Urgent: Admin tooling is NOT optional, it's required for launch

**Phase Execution Plan:**
Phases 1 and 4 (Admin UI) run in parallel with Phase 2-3:

- Phase 1: Schema (2-3 hrs) - must complete first
- Phase 2: API (4-5 hrs) - start after Phase 1, before Phase 3
- Phase 3: Frontend (2-3 hrs) - depends on Phase 2 API
- **Phase 4: Admin UI (parallel with Phases 1-3)** (6-8 hrs):
  - Admin UI needed day 2 onwards to approve memberships
  - Can start after Phase 1 schema is created

**Total compressed timeline: ~1 week to launch-ready (by Sept 7)**

---

## Summary

This redesign transforms the system from a transactional order processor into a proper membership management system with:

- ✅ Persistent member records across years
- ✅ Secure renewal workflow (duplicate detection + manual admin approval)
- ✅ Simple, pragmatic anti-abuse safeguards (registration window gate, audit trail)
- ✅ Admin tooling for approval queue, member search, year transition
- ✅ Foundation for Phase 6: Self-service member portal (passwordless login via email code, future)

**v1 Security Model:** Registration window toggle (admin closes submissions after deadline) + manual approval provides sufficient control for a small, established site with low attack surface.

**Launch Target: Sept 7, 2026 (1 week, Phases 1-4 in parallel)**

**Phase 5 (Post-Launch):** Member self-service portal

- Passwordless login: "Enter email, click link, enter 6-digit code, see your membership history"
- Renew membership from authenticated session
- View division selections + entry results
- See payment history

---

**Ready to proceed with Phase 1: Schema Creation?**
