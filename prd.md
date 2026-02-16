# Product Requirements Document: FitStudio Platform

## Gym Management Software for Boutique Fitness Studios

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Target Market](#2-product-vision--target-market)
3. [Tier Breakdown](#3-tier-breakdown)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Models](#5-data-models)
6. [API Design](#6-api-design)
7. [Mobile App Specifications](#7-mobile-app-specifications)
8. [Security & Compliance](#8-security--compliance)
9. [Instructor Management Module](#9-instructor-management-module)
10. [Success Metrics](#10-success-metrics)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Executive Summary

### Overview

FitStudio is a tiered SaaS platform designed for boutique fitness studios (Hyrox, yoga, Pilates, cycling, etc.). The platform provides comprehensive studio management tools including membership management, class scheduling, automated billing, marketing automation, and member engagement features.

### Key Value Propositions

- **For Studio Owners**: Streamlined operations, reduced admin overhead, increased member retention
- **For Members**: Seamless booking experience, personalized engagement, progress tracking
- **For Instructors**: Easy schedule management, clear compensation tracking, performance visibility

### Pricing Model

Hybrid pricing structure:
- Base tier fee + usage-based add-ons (SMS credits, storage, additional locations)
- Scales with studio growth while maintaining predictable base costs

---

## 2. Product Vision & Target Market

### Vision Statement

Empower boutique fitness studios to deliver exceptional member experiences through intuitive technology, enabling them to focus on what they do best—transforming lives through fitness.

### Target Market

**Primary:**
- Boutique fitness studios (1-10 locations)
- Studio types: Hyrox, yoga, Pilates, cycling, HIIT, barre, boxing, CrossFit
- Revenue range: $100K - $5M annually
- Member base: 100 - 5,000 active members

**Secondary:**
- Fitness franchises seeking unified management
- Personal training studios
- Wellness centers with class offerings

### Market Positioning

| Competitor | Gap We Fill |
|------------|-------------|
| Mindbody | Simpler UX, boutique-focused features, better pricing |
| Mariana Tek | More accessible entry tier, stronger marketing tools |
| Glofox | Superior multi-location support, advanced analytics |
| Zen Planner | Modern mobile experience, gamification |

---

## 3. Tier Breakdown

### 3.1 Base Tier

**Target:** Single-location studios getting started with management software

#### Membership Management
- Create unlimited membership types (monthly, annual, class packs, drop-in)
- Member profiles with contact info, emergency contacts, waivers
- Membership freeze/cancel workflows
- Family/household account linking
- Member self-service portal for profile updates

#### Class Scheduling
- Unlimited class types and schedules
- Recurring class templates (daily, weekly patterns)
- Simple waitlist with FIFO auto-promotion
- Capacity management (simple headcount)
- Class cancellation with automatic member notification
- Instructor assignment to classes

#### Automated Billing
- Stripe integration for payment processing
- Automatic recurring billing for memberships
- Failed payment retry logic (1, 3, 7 day intervals)
- Invoice generation and history
- Proration for mid-cycle changes
- Basic revenue reporting

#### Marketing Automation
- Custom email campaigns (drag-and-drop builder)
- SMS campaigns (usage-based pricing)
- Contact list management with tags
- Embedded lead capture forms
- Basic email templates (welcome, reminder, receipt)
- Unsubscribe management

#### Member App (Branded)
- Studio logo and primary color theming
- Class schedule viewing and booking
- Membership status and payment history
- QR code for check-in
- Push notifications for class reminders
- **Note:** FitStudio branding visible in footer/splash

#### Analytics (Basic Charts)
- Member count and growth trends
- Class attendance rates
- Revenue by month
- Popular class times heatmap
- Export to CSV

---

### 3.2 Mid Tier

**Target:** Growing studios with multiple locations or advanced operational needs

*Includes everything in Base Tier, plus:*

#### Multi-Location Support
- Shared membership types across locations
- Cross-location booking for members
- Staff assignment to multiple locations
- Location-specific schedules with sync
- HQ-controlled data visibility rules

#### Package Sharing
- Class packs valid at any location
- Transfer credits between locations
- Location-specific pricing overrides
- Unified member view across locations

#### Advanced CRM
- Visual member journey mapping
- Lifecycle stage tracking (lead → trial → member → at-risk → churned)
- Lead scoring based on engagement signals
- Automated journey triggers (email/SMS at stage transitions)
- Custom fields for member profiles
- Segmentation builder (filters + saved segments)

#### Pre-Built Campaign Templates
- Lead nurturing sequence (5-email drip)
- New member onboarding (first 30 days)
- Win-back campaigns (re-engagement for lapsed)
- Promotion templates (seasonal offers, referral programs)
- Birthday/anniversary automations

#### Pre-Configured Dashboards
- Class attendance by location
- Revenue breakdown by membership type
- Member retention cohort analysis
- Instructor performance summary
- No setup required—works out of the box

#### Content Suite (Basic)
- Pre-loaded article library (health tips, nutrition, workout guides)
- Recipe database with filtering
- Content feed in member app (category-based browsing)
- Studio announcement posts
- Member favorites/bookmarks

---

### 3.3 Premium Tier

**Target:** Studio chains, franchises, and studios wanting full customization

*Includes everything in Mid Tier, plus:*

#### HQ Marketing Dashboard
- Centralized campaign management across all locations
- Content approval workflows
- Brand asset library
- Cross-location performance comparison
- Unified ad spend tracking integration
- Location-specific vs. brand-wide campaign toggle

#### Custom Analytics Dashboards
- Drag-and-drop dashboard builder
- Custom KPI widgets
- Filter by: location, date range, member type, instructor
- Scheduled report delivery (email PDF)
- Data export API for BI tools
- PDF report generation with studio branding

#### Gamification Engine
- **Challenges:** Studio-created time-bound competitions
  - Individual or team-based
  - Custom rules (attendance, specific classes, streaks)
  - Leaderboards with privacy controls
- **Point System:**
  - Earn points for: check-ins, referrals, purchases, milestones
  - Configurable point values per action
  - Point expiration rules (optional)
- **Badges:**
  - Achievement badges (first class, 100 classes, streak milestones)
  - Custom badge creation with image upload
  - Badge showcase on member profiles
- **Streak Tracking:**
  - Configurable streak rules (weekly attendance, consecutive days)
  - Streak freeze tokens (purchasable or earnable)
  - Streak milestone rewards

#### Video Content Suite
- Upload workout videos and programs
- Series/program organization
- Progress tracking (watched, completed)
- Optional paywall for premium content
- Integration with Vimeo OTT for:
  - Adaptive bitrate streaming
  - DRM protection
  - Offline viewing (mobile)
- Analytics: views, completion rates, engagement

#### White-Label Experience
- Full theme builder:
  - Primary/secondary/accent colors
  - Custom fonts (Google Fonts + upload)
  - Logo placement options
  - Custom CSS injection for advanced styling
- Complete FitStudio branding removal
- Custom app icons and splash screens
- Custom email domain (e.g., notifications@yourstudio.com)
- Embed pages match studio website design

#### Enterprise API Access
- API key management (create, revoke, rotate)
- Monthly request quotas (adjustable)
- Webhook subscriptions for events:
  - Member created/updated
  - Booking made/cancelled
  - Payment processed/failed
  - Check-in recorded
- Rate limiting: 1000 requests/minute default
- API documentation portal
- Sandbox environment for testing

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Admin Web     │   Member App    │    Instructor App           │
│   (React SPA)   │ (React Native)  │   (React Native - view)     │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         └─────────────────┼───────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   API GW    │
                    │  (Express)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │  Auth   │      │  Core API │     │  Worker   │
    │ Service │      │  Service  │     │  Service  │
    └────┬────┘      └─────┬─────┘     └─────┬─────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │PostgreSQL│  │  Redis  │  │   S3    │
         │(Primary) │  │ (Cache) │  │ (Files) │
         └─────────┘  └─────────┘  └─────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend (Web)** | React 18 + TypeScript | Industry standard, rich ecosystem |
| **Mobile Apps** | React Native | Code sharing, native performance |
| **API** | Node.js + Express | Fast development, JavaScript throughout |
| **Database** | PostgreSQL 15 | Robust, ACID compliant, JSON support |
| **Cache** | Redis | Session storage, rate limiting, queues |
| **File Storage** | AWS S3 | Scalable, cost-effective |
| **Search** | PostgreSQL FTS (start), Elasticsearch (scale) | Simple start, upgrade path |
| **Video** | Vimeo OTT / Mux | Managed transcoding, DRM, CDN |
| **Email** | SendGrid | Deliverability, templates, analytics |
| **SMS** | Twilio | Global coverage, reliability |
| **Payments** | Stripe | Subscriptions, invoicing, global |
| **Auth** | Passport.js + JWT | Flexible strategies |
| **Queue** | Bull (Redis-backed) | Job processing, retries |

### 4.3 Multi-Tenancy Architecture

**Approach:** Shared database with tenant identifier

```sql
-- Every tenant-scoped table includes:
tenant_id UUID NOT NULL REFERENCES tenants(id),

-- Row-level security policies
CREATE POLICY tenant_isolation ON members
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

**Benefits:**
- Simple deployment and maintenance
- Cost-effective for large number of small tenants
- Easy cross-tenant queries for platform analytics

**Safeguards:**
- Row-level security (RLS) in PostgreSQL
- Middleware sets tenant context on every request
- Audit logging for cross-tenant access (admin only)

### 4.4 Infrastructure

**Deployment:** AWS

| Service | AWS Component |
|---------|---------------|
| Compute | ECS Fargate (containerized) |
| Database | RDS PostgreSQL (Multi-AZ) |
| Cache | ElastiCache Redis |
| Storage | S3 + CloudFront CDN |
| DNS/SSL | Route 53 + ACM |
| Monitoring | CloudWatch + Datadog |
| CI/CD | GitHub Actions → ECR → ECS |

**Scaling Strategy:**
- Horizontal scaling of API containers
- Read replicas for PostgreSQL as needed
- Redis cluster mode for session distribution

---

## 5. Data Models

### 5.1 Core Entities

#### Tenant (Studio)
```typescript
interface Tenant {
  id: UUID;
  name: string;
  slug: string;                    // unique subdomain
  tier: 'base' | 'mid' | 'premium';
  settings: TenantSettings;
  branding: BrandingConfig;
  stripeCustomerId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface TenantSettings {
  timezone: string;
  currency: string;
  bookingWindowDays: number;
  cancellationWindowHours: number;
  waitlistEnabled: boolean;
  requireWaiver: boolean;
}

interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCss?: string;             // Premium only
}
```

#### Location
```typescript
interface Location {
  id: UUID;
  tenantId: UUID;
  name: string;
  address: Address;
  timezone: string;
  phone: string;
  email: string;
  isActive: boolean;
  settings: LocationSettings;
}
```

#### Member
```typescript
interface Member {
  id: UUID;
  tenantId: UUID;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  emergencyContact?: EmergencyContact;
  profileImageUrl?: string;

  // CRM fields
  lifecycleStage: LifecycleStage;
  leadScore: number;
  tags: string[];
  customFields: Record<string, any>;

  // Gamification
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];

  // Preferences
  marketingConsent: boolean;
  smsConsent: boolean;
  preferredLocationId?: UUID;

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
  lastActiveAt: DateTime;
}

type LifecycleStage =
  | 'lead'
  | 'trial'
  | 'active'
  | 'at_risk'
  | 'churned'
  | 'win_back';
```

#### Membership
```typescript
interface MembershipType {
  id: UUID;
  tenantId: UUID;
  name: string;
  description: string;
  type: 'recurring' | 'class_pack' | 'drop_in';

  // Pricing
  price: number;
  billingInterval?: 'weekly' | 'monthly' | 'yearly';
  classCredits?: number;          // For class packs
  unlimitedClasses: boolean;

  // Restrictions
  validLocationIds?: UUID[];      // null = all locations
  validClassTypeIds?: UUID[];     // null = all class types
  bookingWindowDays: number;

  // Status
  isActive: boolean;
  isPublic: boolean;              // Show on signup page
}

interface MemberMembership {
  id: UUID;
  memberId: UUID;
  membershipTypeId: UUID;
  status: 'active' | 'paused' | 'cancelled' | 'expired';

  // Billing
  stripeSubscriptionId?: string;
  currentPeriodStart: DateTime;
  currentPeriodEnd: DateTime;

  // Credits (for packs)
  creditsRemaining?: number;
  creditsUsed?: number;

  // Lifecycle
  startDate: Date;
  endDate?: Date;
  pausedAt?: DateTime;
  cancelledAt?: DateTime;
  cancellationReason?: string;
}
```

#### Class & Booking
```typescript
interface ClassType {
  id: UUID;
  tenantId: UUID;
  name: string;
  description: string;
  durationMinutes: number;
  defaultCapacity: number;
  color: string;                  // For calendar display
  imageUrl?: string;
  isActive: boolean;
}

interface ClassSession {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  classTypeId: UUID;
  instructorId: UUID;

  // Timing
  startTime: DateTime;
  endTime: DateTime;

  // Capacity
  capacity: number;
  spotsBooked: number;
  waitlistCount: number;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cancellationReason?: string;

  // Recurring
  recurringScheduleId?: UUID;
}

interface Booking {
  id: UUID;
  memberId: UUID;
  classSessionId: UUID;
  status: 'booked' | 'waitlisted' | 'checked_in' | 'no_show' | 'cancelled';

  // Waitlist
  waitlistPosition?: number;
  promotedFromWaitlistAt?: DateTime;

  // Check-in
  checkedInAt?: DateTime;
  checkInMethod?: 'qr_scan' | 'manual' | 'auto';

  // Credit usage
  creditDeducted: boolean;
  memberMembershipId?: UUID;

  // Timestamps
  bookedAt: DateTime;
  cancelledAt?: DateTime;
}
```

#### Instructor/Staff
```typescript
interface Staff {
  id: UUID;
  tenantId: UUID;
  userId: UUID;                   // Links to auth user
  role: 'owner' | 'admin' | 'manager' | 'instructor' | 'front_desk';

  // Profile
  displayName: string;
  bio?: string;
  profileImageUrl?: string;

  // Instructor-specific
  isInstructor: boolean;
  certifications: Certification[];
  teachableClassTypes: UUID[];

  // Availability
  defaultAvailability: WeeklyAvailability;

  // Compensation
  payRate: number;
  payType: 'per_class' | 'hourly';

  // Access
  locationAccess: UUID[];         // Which locations they can access
  permissions: Permission[];

  isActive: boolean;
}

interface Certification {
  name: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
}
```

### 5.2 Marketing & CRM Entities

```typescript
interface Campaign {
  id: UUID;
  tenantId: UUID;
  name: string;
  type: 'email' | 'sms' | 'push';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';

  // Content
  subject?: string;               // Email only
  content: string;
  templateId?: UUID;

  // Targeting
  segmentId?: UUID;
  recipientCount: number;

  // Schedule
  scheduledAt?: DateTime;
  sentAt?: DateTime;

  // Stats
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

interface Segment {
  id: UUID;
  tenantId: UUID;
  name: string;
  filters: SegmentFilter[];
  memberCount: number;
  isDynamic: boolean;             // Auto-update membership
  lastCalculatedAt: DateTime;
}

interface Journey {
  id: UUID;
  tenantId: UUID;
  name: string;
  triggerType: 'lifecycle_change' | 'tag_added' | 'event' | 'date';
  triggerConfig: Record<string, any>;
  steps: JourneyStep[];
  isActive: boolean;
}
```

### 5.3 Gamification Entities

```typescript
interface Challenge {
  id: UUID;
  tenantId: UUID;
  name: string;
  description: string;
  imageUrl?: string;

  // Timing
  startDate: DateTime;
  endDate: DateTime;

  // Rules
  type: 'individual' | 'team';
  goal: ChallengeGoal;

  // Rewards
  pointsReward: number;
  badgeReward?: UUID;

  // Participation
  participantCount: number;
  isPublic: boolean;
}

interface ChallengeGoal {
  metric: 'check_ins' | 'specific_class_type' | 'streak_days' | 'points_earned';
  target: number;
  classTypeIds?: UUID[];          // For specific_class_type
}

interface Badge {
  id: UUID;
  tenantId: UUID;
  name: string;
  description: string;
  imageUrl: string;

  // Earning criteria
  earnType: 'automatic' | 'manual' | 'challenge';
  automaticCriteria?: BadgeCriteria;
}

interface PointTransaction {
  id: UUID;
  memberId: UUID;
  points: number;                 // Positive = earn, negative = spend
  type: 'check_in' | 'referral' | 'purchase' | 'challenge' | 'redemption' | 'adjustment';
  referenceId?: UUID;
  description: string;
  createdAt: DateTime;
}
```

---

## 6. API Design

### 6.1 API Structure

**Base URL:** `https://api.fitstudio.io/v1`

**Authentication:**
- Member/Staff: JWT Bearer token
- External API: API Key in header (`X-API-Key`)

**Common Headers:**
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>        // Required for multi-tenant context
Content-Type: application/json
```

### 6.2 Core Endpoints

#### Authentication
```
POST   /auth/register              # Member registration
POST   /auth/login                 # Email/password login
POST   /auth/login/social          # Google/Apple OAuth
POST   /auth/refresh               # Refresh JWT
POST   /auth/forgot-password       # Request password reset
POST   /auth/reset-password        # Complete password reset
POST   /auth/logout                # Invalidate tokens
```

#### Members
```
GET    /members                    # List members (staff only)
GET    /members/:id                # Get member details
PUT    /members/:id                # Update member
DELETE /members/:id                # Soft delete member
GET    /members/:id/bookings       # Member's bookings
GET    /members/:id/memberships    # Member's memberships
GET    /members/:id/payments       # Payment history
GET    /members/:id/points         # Points history
POST   /members/:id/tags           # Add tags
DELETE /members/:id/tags/:tag      # Remove tag
```

#### Memberships
```
GET    /membership-types           # List available memberships
POST   /membership-types           # Create membership type (staff)
GET    /memberships                # List member's active memberships
POST   /memberships                # Purchase/assign membership
PUT    /memberships/:id            # Update (pause, cancel)
POST   /memberships/:id/pause      # Pause membership
POST   /memberships/:id/resume     # Resume membership
POST   /memberships/:id/cancel     # Cancel membership
```

#### Classes
```
GET    /class-types                # List class types
GET    /classes                    # List scheduled classes
GET    /classes/:id                # Class details with roster
POST   /classes                    # Schedule a class (staff)
PUT    /classes/:id                # Update class
DELETE /classes/:id                # Cancel class
GET    /classes/:id/roster         # Attendee list
GET    /classes/:id/waitlist       # Waitlist
```

#### Bookings
```
POST   /bookings                   # Book a class
DELETE /bookings/:id               # Cancel booking
POST   /bookings/:id/check-in      # Check in (QR scan)
GET    /bookings/upcoming          # Member's upcoming bookings
GET    /bookings/history           # Member's past bookings
```

#### Schedule
```
GET    /schedule                   # Weekly schedule view
GET    /schedule/recurring         # Recurring schedule templates
POST   /schedule/recurring         # Create recurring schedule
PUT    /schedule/recurring/:id     # Update recurring schedule
```

### 6.3 Premium API (Enterprise)

**Rate Limits:** 1000 requests/minute (adjustable)

#### Webhooks
```
GET    /webhooks                   # List webhook subscriptions
POST   /webhooks                   # Create webhook
PUT    /webhooks/:id               # Update webhook
DELETE /webhooks/:id               # Delete webhook
GET    /webhooks/:id/deliveries    # Delivery history
POST   /webhooks/:id/test          # Send test payload
```

**Webhook Events:**
```
member.created
member.updated
member.deleted
booking.created
booking.cancelled
booking.checked_in
payment.succeeded
payment.failed
membership.activated
membership.cancelled
check_in.recorded
```

#### Bulk Operations
```
POST   /bulk/members               # Bulk import members
POST   /bulk/bookings              # Bulk create bookings
GET    /bulk/exports/:id           # Download export file
```

#### Analytics API
```
GET    /analytics/members          # Member metrics
GET    /analytics/revenue          # Revenue metrics
GET    /analytics/attendance       # Attendance metrics
GET    /analytics/retention        # Retention cohorts
```

### 6.4 Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 7. Mobile App Specifications

### 7.1 App Architecture

**Framework:** React Native (iOS + Android)

**Distribution Model:** App Cloning System
- Single codebase with dynamic configuration
- Separate app builds per studio (Premium tier)
- Custom bundle IDs and app store listings
- Build automation pipeline for white-label apps

### 7.2 Member App Features

#### Home Screen
- Today's booked classes
- Upcoming schedule preview
- Quick book button
- Streak counter (if active)
- Points balance (if enabled)
- Studio announcements banner

#### Schedule & Booking
- Weekly/daily calendar view
- Filter by class type, instructor, location
- Class details modal
- One-tap booking
- Waitlist join with position display
- Add to device calendar
- Share class with friends

#### Check-In
- QR code display (fullscreen mode)
- Check-in history
- Auto-brightness on QR display

#### Profile & Account
- Personal information editing
- Membership status and details
- Payment methods (Stripe)
- Payment history
- Notification preferences
- Marketing consent toggles
- Waiver signing (if required)

#### Content Feed (Mid+ Tier)
- Category browsing (articles, recipes, tips)
- Favorites/bookmarks
- Search functionality
- Studio announcements
- Video content player (Premium)

#### Gamification (Premium Tier)
- Points balance and history
- Badge collection display
- Active challenges list
- Challenge leaderboards
- Streak tracker with freeze tokens
- Achievement notifications

### 7.3 Instructor View

**Access:** Toggle in member app for users with instructor role

#### Instructor-Specific Features
- Today's teaching schedule
- Upcoming classes to teach
- Class roster access
- Manual check-in capability
- Attendance marking
- Substitute request submission
- Pay period summary
- Certification status alerts

### 7.4 Technical Specifications

| Aspect | Specification |
|--------|---------------|
| Min iOS Version | 14.0 |
| Min Android Version | API 26 (Android 8.0) |
| Offline Support | None (online-only) |
| Push Notifications | Firebase Cloud Messaging |
| Deep Linking | Universal Links (iOS), App Links (Android) |
| Analytics | Mixpanel / Amplitude |
| Crash Reporting | Sentry |

### 7.5 White-Label Build Pipeline

```
1. Studio requests white-label app
2. Admin configures branding in dashboard
3. Build triggered via CI/CD:
   - Pull base React Native codebase
   - Inject tenant-specific config (colors, fonts, assets)
   - Generate app icons (all sizes)
   - Update bundle ID and app name
   - Build iOS (.ipa) and Android (.aab)
4. Automated app store submission (Fastlane)
5. Studio notified when live
```

---

## 8. Security & Compliance

### 8.1 Authentication & Authorization

#### Authentication Methods
- Email/password with bcrypt hashing (cost factor 12)
- Google OAuth 2.0
- Apple Sign In
- JWT tokens (15-minute access, 7-day refresh)

#### Authorization Model
- Role-based access control (RBAC)
- Roles: owner, admin, manager, instructor, front_desk, member
- Permission granularity at feature level
- Location-scoped permissions for multi-location

#### Session Security
- Refresh token rotation
- Device tracking and management
- Suspicious login detection
- Password strength enforcement (zxcvbn score ≥ 3)

### 8.2 Data Protection

#### Encryption
- Data at rest: AES-256 (RDS encryption)
- Data in transit: TLS 1.3
- Sensitive fields: Application-level encryption (PII)

#### Data Isolation
- PostgreSQL Row-Level Security (RLS)
- Tenant context enforced on every query
- Audit logging for admin operations

### 8.3 GDPR Compliance

| Requirement | Implementation |
|-------------|----------------|
| Right to Access | Member data export (JSON/CSV) |
| Right to Erasure | Account deletion with 30-day grace period |
| Data Portability | Standardized export format |
| Consent Management | Granular consent tracking (marketing, SMS) |
| Privacy by Design | Minimal data collection, purpose limitation |
| Breach Notification | Automated detection, 72-hour notification process |

#### Data Retention
- Active member data: Retained while active
- Deleted accounts: Anonymized after 30 days
- Payment records: 7 years (regulatory requirement)
- Analytics data: Aggregated after 2 years

### 8.4 PCI DSS Compliance

**Approach:** Stripe handles all card data (PCI DSS Level 1)

| Control | Implementation |
|---------|----------------|
| Card Storage | Never stored—Stripe tokens only |
| Payment Processing | Stripe.js + Elements (client-side tokenization) |
| Webhooks | Signature verification for all Stripe events |
| Access Logging | All payment operations logged |
| Network Security | Stripe API calls over TLS only |

### 8.5 Security Monitoring

- AWS GuardDuty for threat detection
- CloudTrail for API audit logs
- WAF rules for OWASP Top 10
- Rate limiting on all endpoints
- DDoS protection via CloudFront

---

## 9. Instructor Management Module

### 9.1 Overview

Comprehensive workforce management for studio instructors, including scheduling, availability, compensation, certifications, and performance tracking.

### 9.2 Features

#### Availability Management
- Weekly default availability template
- Date-specific overrides
- Blackout dates (vacations, unavailable periods)
- Location-specific availability (for multi-location)
- Mobile availability updates

#### Schedule Management
- View assigned classes
- Request schedule changes
- Substitute requests:
  - Submit request with reason
  - Available subs see and can claim
  - Manager approval workflow
- Conflict detection when scheduling

#### Compensation Tracking
- Per-class flat rate configuration
- Different rates by:
  - Class type
  - Location
  - Peak vs. off-peak
- Pay period summaries
- Exportable pay reports (CSV, PDF)
- Integration-ready for payroll systems

#### Certifications
- Certification records with expiry tracking
- Document upload (certificates, insurance)
- Expiry alerts (30, 14, 7 days before)
- Certification requirements by class type
- Automatic class restriction if cert expired

#### Performance Metrics
- Classes taught (period, lifetime)
- Average class attendance
- Member feedback scores
- Cancellation rate
- No-show handling rate
- Attendance trend over time

### 9.3 Data Model

```typescript
interface InstructorProfile {
  staffId: UUID;

  // Availability
  defaultAvailability: {
    [day: string]: TimeSlot[];    // 'monday': [{start: '06:00', end: '12:00'}]
  };
  availabilityOverrides: AvailabilityOverride[];

  // Compensation
  payRates: PayRate[];

  // Certifications
  certifications: Certification[];

  // Stats (computed)
  stats: {
    totalClassesTaught: number;
    avgAttendance: number;
    avgRating: number;
    cancellationRate: number;
  };
}

interface PayRate {
  id: UUID;
  amount: number;
  classTypeId?: UUID;             // null = default rate
  locationId?: UUID;              // null = all locations
  isPeakRate: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

interface SubstituteRequest {
  id: UUID;
  requestingInstructorId: UUID;
  classSessionId: UUID;
  reason: string;
  status: 'pending' | 'claimed' | 'approved' | 'rejected';
  claimedById?: UUID;
  approvedById?: UUID;
  createdAt: DateTime;
}
```

### 9.4 Admin Interface

#### Instructor List View
- All instructors with key stats
- Filter by location, certification status
- Quick actions: schedule, message, view profile

#### Individual Instructor View
- Profile and bio editing
- Certification management
- Availability calendar
- Pay rate configuration
- Performance dashboard
- Class history

#### Pay Report Generation
- Select date range
- Filter by location, instructor
- Preview before export
- Export as PDF (branded) or CSV
- Scheduled report delivery (email)

---

## 10. Success Metrics

### 10.1 Platform Metrics

| Metric | Target (Year 1) | Measurement |
|--------|-----------------|-------------|
| Studios Onboarded | 100 | Count of active tenants |
| Monthly Active Members | 25,000 | Unique logins |
| Booking Volume | 100,000/month | Total bookings |
| Platform Uptime | 99.9% | Monitoring tools |
| API Response Time | <200ms (p95) | APM tracking |

### 10.2 Studio Success Metrics

| Metric | Benchmark | Description |
|--------|-----------|-------------|
| Member Retention | >80% annual | % renewing memberships |
| Class Fill Rate | >75% | Booked spots / capacity |
| No-Show Rate | <10% | No-shows / bookings |
| Revenue per Member | +15% YoY | Average member spend |
| Lead Conversion | >20% | Leads → paying members |

### 10.3 Product Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| NPS | >50 | Net Promoter Score |
| Feature Adoption | >60% | Studios using key features |
| Support Tickets | <5 per studio/month | Indicates UX quality |
| Tier Upgrades | 25% of Base → Mid | Expansion revenue |

### 10.4 Technical Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Error Rate | <0.1% | Server errors / requests |
| API Latency (p95) | <200ms | 95th percentile response |
| Mobile Crash Rate | <1% | Crash-free sessions |
| Deployment Frequency | Daily | CI/CD efficiency |

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Goal:** Core platform with Base tier functionality for single studio MVP

#### Month 1: Infrastructure & Auth
- [ ] Set up AWS infrastructure (Terraform)
- [ ] PostgreSQL database with multi-tenant schema
- [ ] Authentication system (email, social)
- [ ] Basic admin UI scaffold (React)
- [ ] CI/CD pipeline

#### Month 2: Core Features
- [ ] Member management CRUD
- [ ] Membership types and billing (Stripe)
- [ ] Class types and scheduling
- [ ] Basic booking flow
- [ ] QR code check-in

#### Month 3: Member App v1
- [ ] React Native app setup
- [ ] Schedule viewing and booking
- [ ] Member profile and account
- [ ] QR check-in display
- [ ] Push notifications

**Deliverable:** Working single-studio platform with Base tier features

---

### Phase 2: Marketing & Growth (Months 4-5)

**Goal:** Complete Base tier with marketing tools

#### Month 4: Marketing Foundation
- [ ] Email campaign builder
- [ ] SendGrid integration
- [ ] Contact list management
- [ ] Basic email templates
- [ ] Unsubscribe management

#### Month 5: SMS & Lead Capture
- [ ] Twilio SMS integration
- [ ] SMS campaign creation
- [ ] Embedded lead forms
- [ ] WordPress plugin
- [ ] Webflow integration
- [ ] Basic analytics dashboard

**Deliverable:** Complete Base tier ready for initial customers

---

### Phase 3: Mid Tier (Months 6-8)

**Goal:** Multi-location and advanced CRM features

#### Month 6: Multi-Location
- [ ] Location management
- [ ] Cross-location memberships
- [ ] Location-scoped permissions
- [ ] HQ data visibility controls

#### Month 7: Advanced CRM
- [ ] Lifecycle stage tracking
- [ ] Lead scoring engine
- [ ] Segmentation builder
- [ ] Member journey mapping
- [ ] Journey automation

#### Month 8: Templates & Content
- [ ] Pre-built campaign templates
- [ ] Pre-configured dashboards
- [ ] Content feed in member app
- [ ] Article/recipe library
- [ ] Studio announcements

**Deliverable:** Mid tier feature-complete

---

### Phase 4: Premium Tier (Months 9-12)

**Goal:** Enterprise features and white-label capabilities

#### Month 9: Analytics & Reporting
- [ ] Custom dashboard builder
- [ ] Advanced filtering
- [ ] PDF report generation
- [ ] Scheduled reports
- [ ] Data export API

#### Month 10: Gamification
- [ ] Points system
- [ ] Badge engine
- [ ] Challenge creation
- [ ] Leaderboards
- [ ] Streak tracking

#### Month 11: Video & Content
- [ ] Vimeo OTT integration
- [ ] Video upload workflow
- [ ] Program organization
- [ ] Paywall implementation
- [ ] Video analytics

#### Month 12: White-Label & API
- [ ] Full theme builder
- [ ] App cloning pipeline
- [ ] FitStudio branding removal
- [ ] Enterprise API
- [ ] Webhook system
- [ ] API documentation portal

**Deliverable:** Complete Premium tier, platform ready for scale

---

### Phase 5: Optimization (Months 13+)

**Ongoing:**
- Performance optimization
- Feature refinement based on feedback
- Additional integrations
- International expansion preparation
- Advanced analytics and ML features

---

## Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| Tenant | A studio organization using the platform |
| Member | End user who attends classes |
| Credit | Booking unit for class pack memberships |
| Waitlist | Queue for full classes |
| Journey | Automated sequence of marketing touchpoints |
| Segment | Dynamic group of members based on criteria |
| Challenge | Time-bound gamification competition |
| Streak | Consecutive period of activity |

### B. Integration Partners

| Category | Recommended Partners |
|----------|---------------------|
| Payments | Stripe |
| Email | SendGrid |
| SMS | Twilio |
| Video | Vimeo OTT, Mux |
| Analytics | Mixpanel, Amplitude |
| Error Tracking | Sentry |
| Infrastructure | AWS |

### C. Competitive Analysis Summary

| Feature | FitStudio | Mindbody | Mariana Tek | Glofox |
|---------|-----------|----------|-------------|--------|
| Boutique Focus | High | Medium | High | High |
| Entry Price | Low | High | High | Medium |
| Gamification | Full | Basic | None | Basic |
| White-Label App | Yes | Paid Add-on | Yes | Yes |
| API Access | Premium | Enterprise | Enterprise | Enterprise |
| Multi-Location | Mid Tier | All Tiers | Enterprise | Enterprise |

---

*End of Document*
