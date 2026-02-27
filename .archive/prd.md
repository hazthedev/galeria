Product Requirements Document (PRD)
Event Moments Capture & Lucky Draw Platform
Version: 1.0
Last Updated: January 9, 2026
Document Owner: Product Team
Status: Draft - Ready for Development

📋 Table of Contents

Executive Summary
Product Overview
Goals & Objectives
Target Users & Personas
Core Features & Requirements
Multi-Tenant Architecture (Repackaging Strategy)
User Flows & Journeys
Technical Requirements
UI/UX Specifications
Security & Privacy
Monetization Strategy
Analytics & Metrics
Launch Strategy & Roadmap
Risk Assessment
Success Criteria
Appendix


1. Executive Summary
1.1 Product Vision
A white-label, real-time collaborative photo sharing and engagement platform that transforms event experiences through interactive moment capture and gamified lucky draw features. The platform enables event organizers to create memorable, engaging experiences while collecting authentic user-generated content.
1.2 Problem Statement
Current Pain Points:

Event attendees take photos but never share them with organizers/other guests
Traditional photo sharing requires apps/accounts (friction)
Event engagement drops during downtimes
Lucky draw systems are manual, clunky, and not exciting
Event organizers struggle to collect and organize photos post-event
Existing solutions are expensive, complex, or not mobile-optimized

Our Solution:
A frictionless, mobile-first web app accessible via QR code that enables instant photo sharing, real-time engagement, and gamified experiences without downloads or logins.
1.3 Business Model

Freemium SaaS with tiered pricing (Free, Pro, Premium, Enterprise)
One-time event purchases and monthly/annual subscriptions
White-label licensing for event management companies
Marketplace revenue from templates, add-ons, and print services

1.4 Key Differentiators

✅ Zero friction: No app download, no login required
✅ White-label ready: Complete rebranding for B2B clients
✅ Real-time engagement: Live photo feed and interactive features
✅ Multi-purpose: Photo gallery + Lucky draw in one platform
✅ Mobile-first: Optimized for smartphone users (90% of traffic)
✅ Event-agnostic: Works for birthdays, weddings, corporate events, conferences


2. Product Overview
2.1 Product Description
A web-based platform that creates unique event microsites accessible via QR code, enabling guests to:

Upload and view photos in real-time
Participate in lucky draws
Engage with other attendees' content
Create shared event memories

Organizers can:

Customize branding and themes
Moderate content
Run engaging lucky draws
Download all content post-event
Access analytics and insights

2.2 Core Value Propositions
For Event Attendees (Guests):

Effortless sharing without app downloads
See all event photos in real-time
Fun participation through lucky draws
Preserve memories instantly
Anonymous option for privacy

For Event Organizers:

Collect high-quality UGC (user-generated content)
Increase event engagement
Professional-looking galleries
Easy content management
Memorable guest experience

For Enterprise Clients (Event Companies/Venues):

White-label solution with their branding
Consistent experience across all their events
Revenue generation opportunity
Client satisfaction enhancement
Competitive differentiation

2.3 Product Type & Platform

Type: Progressive Web App (PWA)
Primary Platform: Mobile web (responsive)
Secondary Platform: Desktop web
Access Method: QR code → Event-specific URL
Architecture: Multi-tenant SaaS with white-label capabilities


3. Goals & Objectives
3.1 Business Goals
Year 1 (Months 1-12):

Acquire 5,000 registered organizers
Achieve 500 paying customers
Host 10,000+ events on platform
Generate $100,000 ARR (Annual Recurring Revenue)
Secure 2 Enterprise white-label clients
Achieve 7% free-to-paid conversion rate

Year 2 (Months 13-24):

Scale to 50,000 registered organizers
5,000 paying customers
100,000+ events hosted
$500,000 ARR
10 Enterprise clients
10% conversion rate

Year 3 (Months 25-36):

200,000 registered organizers
20,000 paying customers
500,000+ events hosted
$2,000,000 ARR
50 Enterprise clients
International expansion (3 languages)

3.2 Product Goals (MVP - Version 1.0)
Must-Have (P0):

 Event creation with unique QR code/URL
 Photo upload (max 5 per user) with rate limiting
 Real-time photo gallery display
 Lucky draw system with 3 animation styles
 Admin dashboard for event management
 Bulk photo download (ZIP)
 Mobile-responsive design
 Basic customization (colors, logo)
 User rate limiting (IP + fingerprint)
 Content moderation queue

Should-Have (P1 - Launch + 1 month):

 Photo reactions (emoji)
 10+ frame/template options
 Extended analytics dashboard
 Multiple lucky draw winners (top 3, 5)
 Email notifications
 Photo compression optimization
 Offline queue for uploads

Nice-to-Have (P2 - Months 2-6):

 Photo filters/stickers
 Slideshow mode for display
 Video upload support
 Guest photo albums (personalized view)
 Social media sharing
 Multi-language support
 Integration APIs

3.3 User Goals
Event Guests:

Upload photos in <30 seconds
View all event photos seamlessly
Participate in lucky draw easily
Stay anonymous if preferred
Have fun and feel engaged

Event Organizers:

Set up event in <5 minutes
Customize look to match event theme
Moderate content effortlessly
Run exciting lucky draws
Download all content easily
Understand engagement metrics

Enterprise Clients:

Deploy white-label solution in <1 week
Maintain consistent brand experience
Manage multiple events simultaneously
Access cross-event analytics
Provide exceptional client service


4. Target Users & Personas
4.1 Primary Personas
Persona 1: "Party Organizer Priya"
Demographics:

Age: 28-35
Occupation: Marketing professional / Small business owner
Tech-savvy: High
Events: Hosts 2-4 personal events/year (birthdays, parties)

Goals:

Create memorable experiences for friends/family
Collect photos from all attendees easily
Avoid complicated tech setup
Stay within budget ($0-30/event)

Pain Points:

Friends never send photos after events
WhatsApp groups get messy
Wants something more professional than Google Photos
Limited time for setup

Use Cases:

Birthday parties (30-50 people)
Anniversary celebrations
Casual get-togethers
Holiday parties

Tier Match: Free → Pro

Persona 2: "Wedding Planner Wendy"
Demographics:

Age: 30-45
Occupation: Professional event/wedding planner
Tech-savvy: Medium-High
Events: Plans 50-100 events/year

Goals:

Offer premium services to clients
Streamline event photo collection
Create engaging guest experiences
Stand out from competitors
Ensure everything runs smoothly

Pain Points:

Expensive photo booth alternatives
Manual lucky draw processes
Client expectations for "instagrammable" moments
Photo collection/organization takes time post-event

Use Cases:

Weddings (100-300 guests)
Corporate events
Product launches
Award ceremonies

Tier Match: Premium (per-event) or Enterprise

Persona 3: "Corporate Event Manager Carlos"
Demographics:

Age: 35-50
Occupation: Corporate communications / HR / Event manager
Tech-savvy: Medium
Events: 10-30 company events/year

Goals:

Boost employee engagement
Collect content for internal comms
Professional appearance
Budget accountability
Easy reporting to leadership

Pain Points:

Generic solutions don't match brand
Security/privacy concerns with public platforms
Need approval workflows
Require usage analytics for ROI

Use Cases:

Company anniversaries
Team building events
Holiday parties
Town halls / Conferences

Tier Match: Premium or Enterprise

Persona 4: "Venue Owner Victor"
Demographics:

Age: 40-60
Occupation: Event venue / Restaurant owner
Tech-savvy: Low-Medium
Events: Hosts 100+ events/year (clients' events)

Goals:

Add value for clients renting venue
Differentiate from competitors
Increase repeat bookings
Generate additional revenue
Simple, hands-off solution

Pain Points:

Clients ask about photo solutions
Doesn't want to manage tech
Needs white-label to match venue brand
Must work reliably without staff involvement

Use Cases:

Venue offering as add-on service
Included in premium packages
Upsell opportunity
Marketing tool (collect testimonials/photos)

Tier Match: Enterprise (white-label)

4.2 Secondary Personas
Persona 5: "Event Guest Grace"
Demographics:

Age: 18-65
Occupation: Varies
Tech-savvy: Low-Medium
Events: Attends 5-15 events/year

Goals:

Participate in event activities
Share photos easily
See what others captured
Possibly win lucky draw

Pain Points:

Doesn't want to download apps
Forgets to send photos to host
Privacy concerns about sharing photos

User Type: End-user (not paying customer)

5. Core Features & Requirements
5.1 Event Management System
5.1.1 Event Creation (Organizer)
Requirements:

Simple event creation form (<5 minutes to complete)
Required fields:

Event name (max 100 characters)
Event date & time
Event type (Birthday, Wedding, Corporate, Other)
Time zone


Optional fields:

Description (max 500 characters)
Location/venue name
Expected guest count
Event duration (hours)
Custom hashtag



Customization Options (Tier-based):
FeatureFreeProPremiumEnterpriseColor scheme3 presetsCustom hex codesCustom hex codesFull CSS controlLogo upload❌✅ (max 2MB)✅ (max 5MB)✅ (unlimited)Frame templates3 basic20 options50+ optionsCustom templatesCustom domain❌❌❌✅Watermark removal❌✅✅✅Background image❌✅✅✅
Output:

Unique event ID (e.g., evt_abc123xyz)
Event URL: app.com/e/evt_abc123xyz
Downloadable QR code (PNG, SVG formats)
Admin dashboard URL with secret token

Technical Specs:
javascriptEvent Schema {
  id: string (UUID),
  organizer_id: string,
  name: string,
  slug: string (unique, URL-friendly),
  description: string,
  event_type: enum ['birthday', 'wedding', 'corporate', 'other'],
  event_date: timestamp,
  timezone: string,
  location: string,
  expected_guests: integer,
  settings: {
    theme: {
      primary_color: string (hex),
      secondary_color: string (hex),
      background: string (url or color),
      logo_url: string,
      frame_template: string
    },
    features: {
      photo_upload_enabled: boolean,
      lucky_draw_enabled: boolean,
      reactions_enabled: boolean,
      moderation_required: boolean,
      anonymous_allowed: boolean
    },
    limits: {
      max_photos_per_user: integer (default: 5),
      max_total_photos: integer,
      max_draw_entries: integer
    }
  },
  status: enum ['draft', 'active', 'ended', 'archived'],
  tier: enum ['free', 'pro', 'premium', 'enterprise'],
  qr_code_url: string,
  created_at: timestamp,
  updated_at: timestamp,
  expires_at: timestamp
}
5.1.2 QR Code Generation
Requirements:

Auto-generate on event creation
High contrast for easy scanning
Embedded event URL
Customizable (Premium+):

Add logo in center
Custom colors
Branded design



Download Options:

PNG (300x300, 600x600, 1200x1200)
SVG (vector, scalable)
PDF (printable, A4 size with instructions)

Printable Assets (Premium+):

Table tent template (fold-able card)
Poster (A3/A4 size)
Instagram story template
Email signature graphic

Technical Specs:
javascriptQR Code Generation {
  content: event_url,
  size: 1024px (high-res),
  error_correction: 'H' (30% resilience),
  logo_embed: boolean (Premium+),
  colors: {
    foreground: hex,
    background: hex
  }
}
```

#### 5.1.3 Event Dashboard (Organizer View)

**Real-time Stats Panel:**
```
┌─────────────────────────────────────────┐
│  Dashboard - Sarah's Birthday Party     │
├─────────────────────────────────────────┤
│  👥 68 Unique Visitors                  │
│  📸 127 Photos Uploaded                 │
│  🎲 34 Lucky Draw Entries               │
│  ❤️ 456 Total Reactions                 │
│  📊 Peak Time: 8:30 PM                  │
└─────────────────────────────────────────┘
```

**Navigation Tabs:**
1. **Overview** - Stats & timeline
2. **Photos** - Grid view with moderation controls
3. **Lucky Draw** - Entries list & draw controls
4. **Settings** - Event configuration
5. **Download** - Export all content
6. **Analytics** (Pro+) - Detailed insights

**Key Actions:**
- Start/Pause photo uploads
- Approve/Reject photos (moderation mode)
- Delete inappropriate content
- Start lucky draw
- Announce winner
- Download all photos (ZIP)
- Share admin access (Premium+)
- End event
- Archive/Delete event

**Technical Specs:**
- Real-time updates via WebSocket
- Auto-refresh every 30 seconds (fallback)
- Push notifications for milestones (Premium+)
- Export data as CSV/JSON

---

### 5.2 Photo Upload & Gallery System

#### 5.2.1 Guest Photo Upload Flow

**Step 1: Landing Page**
```
User scans QR → Redirected to: app.com/e/evt_abc123xyz

Landing Page Elements:
┌──────────────────────────────────────┐
│  [Event Logo/Banner]                 │
│                                      │
│  🎉 Sarah's 30th Birthday Party 🎉  │
│  Saturday, March 15, 2026            │
│                                      │
│  [📸 View Photos] [🎲 Lucky Draw]   │
│                                      │
│  "127 moments captured so far!"      │
└──────────────────────────────────────┘
```

**Step 2: Photo Gallery View**
- Masonry/grid layout (responsive)
- Infinite scroll (load 20 photos at a time)
- Photos display: thumbnail → click for fullscreen
- Real-time: new photos fade in at top
- Filter options (Pro+):
  - Sort by: Newest, Most liked, Random
  - Filter by: All, My uploads, Favorites

**Step 3: Upload Interface (Floating Action Button)**
```
User clicks [+ Upload Photo] button

Upload Modal:
┌──────────────────────────────────────┐
│  Add Your Moment                     │
├──────────────────────────────────────┤
│  [📷 Take Photo] [🖼️ Choose Photos] │
│                                      │
│  Selected: 0/5 photos                │
│  [Photo Preview Thumbnails]          │
│                                      │
│  Your Name (optional):               │
│  [_______________]                   │
│                                      │
│  Add a wish or caption:              │
│  [______________________________]    │
│  [______________________________]    │
│                                      │
│  [Cancel]  [Submit Photos]           │
└──────────────────────────────────────┘
```

**Upload Requirements:**
- Max 5 photos per submission
- Accepted formats: JPG, PNG, HEIC, WebP
- Max file size: 10MB per photo (before compression)
- Auto-compress client-side to <2MB
- Progress bar during upload
- Error handling with retry option

**Post-Upload:**
```
Success Screen:
┌──────────────────────────────────────┐
│  ✅ Photos Uploaded Successfully!    │
│                                      │
│  Your photos will appear in the      │
│  gallery shortly.                    │
│                                      │
│  [View Gallery] [Upload More (0/5)]  │
└──────────────────────────────────────┘
Technical Specs:
javascriptPhoto Upload Schema {
  id: string (UUID),
  event_id: string,
  user_fingerprint: string (hashed),
  images: [
    {
      original_url: string (S3/R2),
      thumbnail_url: string (300x300),
      medium_url: string (800x800),
      full_url: string (1920x1920),
      width: integer,
      height: integer,
      file_size: integer (bytes),
      format: string
    }
  ],
  caption: string (max 500 chars),
  contributor_name: string (optional, max 50 chars),
  is_anonymous: boolean,
  status: enum ['pending', 'approved', 'rejected'],
  reactions: {
    heart: integer,
    clap: integer,
    laugh: integer,
    wow: integer
  },
  metadata: {
    ip_address: string (hashed),
    user_agent: string,
    upload_timestamp: timestamp,
    device_type: enum ['mobile', 'tablet', 'desktop']
  },
  created_at: timestamp,
  approved_at: timestamp
}
5.2.2 Rate Limiting System
Multi-Layer Approach:
Layer 1: IP-Based Limiting
javascriptRate Limit Rules {
  per_ip_per_event: {
    max_uploads: 5,
    window: 'event_duration'
  },
  per_ip_per_hour: {
    max_requests: 10,
    window: '1 hour'
  }
}
Layer 2: Browser Fingerprinting
javascriptFingerprint Calculation {
  components: [
    'canvas_hash',
    'webgl_hash',
    'audio_hash',
    'screen_resolution',
    'timezone',
    'language',
    'platform',
    'plugins_hash'
  ],
  storage: localStorage (backup),
  expiry: 30 days
}
```

**Layer 3: Time-Based Throttling**
- Min 60 seconds between uploads
- Exponential backoff if user tries too fast
- CAPTCHA after 3 failed attempts

**Bypass Mechanisms (Premium+):**
- Organizer can manually increase limits
- Whitelist specific users/devices
- Temporary limit boost for peak moments

**User Feedback:**
```
If limit reached:
┌──────────────────────────────────────┐
│  Upload Limit Reached                │
│                                      │
│  You've uploaded the maximum 5       │
│  photos for this event.              │
│                                      │
│  Want to share more? Ask the host to │
│  upgrade their event!                │
│                                      │
│  [OK, Got It]                        │
└──────────────────────────────────────┘
```

#### 5.2.3 Content Moderation

**Automatic Moderation (AI-powered):**
- Image scanning for:
  - Nudity/sexual content (block)
  - Violence/gore (block)
  - Hate symbols (block)
  - Weapons (flag for review)
  - Alcohol/drugs (flag if inappropriate context)
  
**Profanity Filter:**
- Scan captions for offensive language
- Auto-censor or flag for review
- Multi-language support (English, Spanish, etc.)

**Moderation Queue (Pro+):**
```
Admin Dashboard → Photos Tab → Pending Review

┌──────────────────────────────────────┐
│  3 Photos Pending Approval           │
├──────────────────────────────────────┤
│  [Photo 1]  Caption: "Great party!"  │
│  Uploaded by: John, 2 mins ago       │
│  AI: ✅ Safe                         │
│  [✅ Approve] [❌ Reject]            │
├──────────────────────────────────────┤
│  [Photo 2]  Caption: "Awesome cake!" │
│  Uploaded by: Anonymous, 5 mins ago  │
│  AI: ⚠️ Review needed (Flagged)     │
│  [✅ Approve] [❌ Reject]            │
└──────────────────────────────────────┘
```

**Moderation Settings:**
- Auto-approve (default, Free tier)
- Manual review required (Pro+)
- AI-assist mode: Auto-approve safe, queue flagged
- Report button for guests to flag content

**Actions:**
- Approve → Publish to gallery
- Reject → Hide from gallery, notify uploader
- Delete → Permanent removal
- Ban user → Block fingerprint from further uploads

#### 5.2.4 Photo Reactions & Engagement (Pro+)

**Reaction Types:**
- ❤️ Heart (love it)
- 👏 Clap (amazing)
- 😂 Laugh (funny)
- 😮 Wow (impressive)

**Implementation:**
- Click/tap emoji under each photo
- Animated response (+1 counter)
- Real-time sync across all viewers
- Limit: 1 reaction per user per photo (can change)

**Display:**
```
Photo Card:
┌──────────────────────────────────┐
│  [Photo Image]                   │
│                                  │
│  "Best night ever! 🎉"          │
│  - Sarah                         │
│                                  │
│  ❤️ 24  👏 12  😂 8  😮 3       │
└──────────────────────────────────┘
```

**Analytics Impact:**
- Track most-liked photos
- Engagement metrics for dashboard
- "Photo of the Event" auto-selection (Premium)

---

### 5.3 Lucky Draw System

#### 5.3.1 Entry Process

**Entry Requirements:**
- 1 selfie photo (required)
- Full name (required for winner announcement)
- Contact info (optional: phone/email for notification)
- Agree to terms (appear on screen if winner)

**Entry Form:**
```
Lucky Draw Tab → Enter Draw

┌──────────────────────────────────────┐
│  🎲 Enter Lucky Draw                 │
├──────────────────────────────────────┤
│  Take or upload your selfie:         │
│  [📷 Capture Selfie] [🖼️ Upload]    │
│                                      │
│  [Selfie Preview]                    │
│                                      │
│  Your Full Name: *                   │
│  [_______________]                   │
│                                      │
│  Phone/Email (for winner notify):    │
│  [_______________]                   │
│                                      │
│  ☐ I agree to be shown on screen    │
│     if I win                         │
│                                      │
│  [Submit Entry]                      │
└──────────────────────────────────────┘

Status: You're entered! 🎉
34 people entered so far
Entry Validation:

Duplicate check: Same name + face match = warning
Photo quality check: Min resolution 200x200
Face detection: Ensure selfie contains a face
One entry per fingerprint (can be adjusted by organizer)

Technical Specs:
javascriptLucky Draw Entry Schema {
  id: string (UUID),
  event_id: string,
  participant_name: string (required),
  selfie_url: string (required),
  contact_info: string (optional, encrypted),
  user_fingerprint: string (hashed),
  agreed_to_display: boolean,
  entry_timestamp: timestamp,
  is_winner: boolean (default: false),
  prize_tier: integer (null until drawn),
  metadata: {
    ip_address: string (hashed),
    device_type: string
  }
}
```

#### 5.3.2 Admin Draw Controls

**Pre-Draw Setup:**
```
Admin Dashboard → Lucky Draw Tab

┌──────────────────────────────────────┐
│  Lucky Draw Configuration            │
├──────────────────────────────────────┤
│  Total Entries: 34                   │
│                                      │
│  Number of Winners:                  │
│  ○ 1 Winner                          │
│  ○ Top 3 (1st, 2nd, 3rd)            │
│  ○ Top 5                             │
│  ● Custom: [_3_] winners             │
│                                      │
│  Animation Style:                    │
│  ○ Slot Machine (5 seconds)          │
│  ● Spinning Wheel (8 seconds)        │
│  ○ Card Shuffle (6 seconds)          │
│  ○ Drum Roll (10 seconds)            │
│  ○ Random Fade (3 seconds)           │
│                                      │
│  Winner Display:                     │
│  ☑ Show selfie                       │
│  ☑ Show full name                    │
│  ☑ Play sound effects                │
│  ☑ Confetti animation                │
│                                      │
│  [Start Lucky Draw] [Preview]        │
└──────────────────────────────────────┘
```

**Draw Execution:**
1. Admin clicks "Start Lucky Draw"
2. Guest view switches to full-screen draw mode
3. Selected animation plays (3-10 seconds)
4. Winner(s) revealed with celebration
5. Option to re-draw if winner absent

**Draw Screen (Guest View):**
```
Full-Screen Mode (TV/Projector-friendly)

┌────────────────────────────────────────┐
│                                        │
│         🎲 LUCKY DRAW TIME! 🎲        │
│                                        │
│     [Spinning Wheel Animation]         │
│                                        │
│   34 entries spinning...               │
│                                        │
└────────────────────────────────────────┘

⬇️ After animation completes ⬇️

┌────────────────────────────────────────┐
│     🎉🎉🎉 WINNER! 🎉🎉🎉            │
│                                        │
│     [Winner's Selfie - Large]          │
│                                        │
│          JOHN SMITH                    │
│                                        │
│     Congratulations! 🏆               │
│                                        │
│     [Confetti Animation Overlay]       │
└────────────────────────────────────────┘
Post-Draw Actions:

Save winner record
Send notification (if contact provided)
Option to draw next place (if multiple winners)
Reset for new round (optional)
Export winner list

5.3.3 Animation Styles (Detailed Specs)
1. Slot Machine

Duration: 5 seconds
Visual: 3 reels spinning with participant photos
Sound: Slot machine sound, ending with "ding!"
Pacing: Fast spin → gradual slow → stop

2. Spinning Wheel

Duration: 8 seconds
Visual: Wheel with participant photos around edge
Sound: Ticking while spinning, fanfare at end
Pacing: Fast spin → slow → pointer lands on winner

3. Card Shuffle

Duration: 6 seconds
Visual: Playing cards shuffling, flipping to reveal
Sound: Card shuffling sounds, flip sound
Pacing: Shuffle → spread → one card flips up

4. Drum Roll

Duration: 10 seconds (most dramatic)
Visual: Participants cycle rapidly, fade to winner
Sound: Drum roll building, cymbal crash
Pacing: Slow build → peak tension → reveal

5. Random Fade (Quick)

Duration: 3 seconds
Visual: Grid of participants → zoom to winner
Sound: Whoosh sound, celebration tone
Pacing: Fast for casual draws

Premium Animations (Premium+):

Custom branded animations
Upload custom sound effects
Video intro/outro clips
Sponsor logo integration

5.3.4 Winner Management
Winner Record:
javascriptWinner Schema {
  id: string,
  event_id: string,
  entry_id: string (reference to entry),
  participant_name: string,
  selfie_url: string,
  prize_tier: integer (1 = 1st place, 2 = 2nd, etc.),
  drawn_at: timestamp,
  drawn_by: string (admin user_id),
  is_claimed: boolean,
  notes: string (optional, admin notes)
}
Winner Actions:

Mark as claimed
Re-draw (if winner absent)
Contact winner (email/SMS from dashboard)
Print certificate (Premium feature)
Add to event timeline

Winner History (Prevent Duplicates):

Track previous winners per event
Option: Exclude previous winners from new draws
Useful for multiple rounds during same event


5.4 Bulk Download & Export
5.4.1 Photo Download (Organizer)
Download Options:
Admin Dashboard → Download Tab

┌──────────────────────────────────────┐
│  Export Event Content                │
├──────────────────────────────────────┤
│  📸 127 Photos Available             │
│                                      │
│  Download Format:                    │
│  ● ZIP file (all photos)             │
│  ○ Individual selection              │
│                                      │
│  Quality:                            │
│  ○ Thumbnails (fast, 300x300)       │
│  ● Medium (web-friendly, 800x800)    │
│  ○ Original (full quality)  [PRO]    │
│                                      │
│  Include:                            │Continue6:01 PM│  ☑ Photo metadata (names, captions)  │
│  ☑ Contributor names (CSV)           │
│  ☑ Timestamp information             │
│  ☐ Reaction counts  [PRO]            │
│                                      │
│  Watermark:  [FREE: Always]          │
│  ● Add watermark (Powered by App)    │
│  ○ No watermark  [PRO+]              │
│                                      │
│  [Generate Download Link]            │
│  Est. file size: 247 MB              │
└──────────────────────────────────────┘

**Download Process:**
1. Admin clicks "Generate Download Link"
2. System queues export job (async)
3. Progress bar shows: "Preparing your download (15%)"
4. When ready: "Your download is ready! [Download ZIP]"
5. Link valid for 7 days (Free), 30 days (Pro+)

**ZIP Structure:**
event_sarah_birthday_2026_03_15/
├── photos/
│   ├── 001_john_smith.jpg
│   ├── 002_anonymous.jpg
│   ├── 003_sarah_jones.jpg
│   └── ...
├── lucky_draw/
│   ├── entries/
│   │   ├── entry_001_john_smith.jpg
│   │   └── ...
│   └── winners/
│       └── winner_1st_john_smith.jpg
├── metadata.csv
└── event_info.txt

**metadata.csv Example:**
```csv
Photo ID,Filename,Contributor,Caption,Upload Time,Reactions
001,001_john_smith.jpg,John Smith,"Great party!",2026-03-15 20:15:32,❤️24 👏12
002,002_anonymous.jpg,Anonymous,"",2026-03-15 20:18:45,❤️8 😂3
```

#### 5.4.2 Data Export (Analytics)

**Export Options (Premium+):**
- Event summary report (PDF)
- Full analytics data (Excel/CSV)
- Timeline of activity (JSON)
- API export for integrations

**Report Contents:**
Event Analytics Report
Sarah's 30th Birthday Party
March 15, 2026
Executive Summary:

Total Unique Visitors: 68
Photos Uploaded: 127
Lucky Draw Entries: 34
Peak Activity: 8:30 PM (23 uploads)
Avg. Photos per Contributor: 3.2
Total Reactions: 456

Top Contributors:

John Smith (8 photos, 67 reactions)
Emily Chen (6 photos, 45 reactions)
Anonymous (5 photos, 32 reactions)

Engagement Timeline:
[Graph showing uploads over time]
Most Popular Photos:
[Top 5 photos by reactions with thumbnails]

---

## 6. Multi-Tenant Architecture (Repackaging Strategy)

### 6.1 White-Label System Overview

**Goal:** Enable the same codebase to power multiple branded instances for different clients (event companies, venues, enterprise customers).

**Architecture Pattern:** Multi-tenant SaaS with tenant isolation

**Key Concepts:**
- **Master Instance:** `app.eventsmoments.com` (our brand)
- **Client Instances:** `events.clientbrand.com` (white-label)
- **Shared Infrastructure:** Single codebase, shared database with tenant isolation
- **Customization Layers:** Branding, features, integrations per tenant

### 6.2 Tenant Management System

#### 6.2.1 Tenant Schema
```javascript
Tenant Schema {
  id: string (UUID),
  tenant_type: enum ['master', 'white_label', 'demo'],
  
  // Branding
  brand_name: string,
  logo_url: string,
  favicon_url: string,
  primary_color: string (hex),
  secondary_color: string (hex),
  font_family: string,
  
  // Domain Configuration
  domain: string (e.g., 'events.clientbrand.com'),
  is_custom_domain: boolean,
  ssl_certificate: object,
  
  // Business Info
  company_name: string,
  contact_email: string,
  support_email: string,
  phone: string,
  
  // Plan & Limits
  subscription_tier: enum ['enterprise', 'custom'],
  billing_plan: object,
  limits: {
    max_events_per_month: integer,
    max_storage_gb: integer,
    max_admins: integer,
    custom_features: array
  },
  
  // Features Toggle
  features_enabled: {
    lucky_draw: boolean,
    photo_reactions: boolean,
    video_uploads: boolean,
    custom_templates: boolean,
    api_access: boolean,
    sso: boolean,
    white_label: boolean
  },
  
  // Customization
  email_templates: object,
  terms_of_service_url: string,
  privacy_policy_url: string,
  custom_css: text,
  custom_js: text (sandboxed),
  
  // Integration
  api_keys: {
    stripe_key: string (encrypted),
    sendgrid_key: string (encrypted),
    analytics_id: string,
    custom_integrations: object
  },
  
  // Status
  status: enum ['active', 'suspended', 'trial'],
  trial_ends_at: timestamp,
  subscription_ends_at: timestamp,
  
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 6.2.2 Tenant Isolation Strategy

**Database Level:**
- Single database with `tenant_id` column on all tables
- Row-level security policies enforce tenant isolation
- Queries always filtered: `WHERE tenant_id = :current_tenant`

**Storage Isolation:**
- S3/R2 folder structure: `/{tenant_id}/{event_id}/{photo_id}.jpg`
- Signed URLs scoped to tenant
- CDN cache keys include tenant_id

**Application Level:**
- Middleware identifies tenant from:
  1. Custom domain (e.g., `events.clientbrand.com`)
  2. Subdomain (e.g., `clientbrand.eventsmoments.com`)
  3. URL path (e.g., `app.com/t/clientbrand`)
- Context object injected: `request.tenant`
- All DB queries automatically scoped

**Example Middleware (Node.js):**
```javascript
async function tenantMiddleware(req, res, next) {
  const hostname = req.hostname;
  
  // Check custom domain
  let tenant = await db.tenants.findOne({ domain: hostname });
  
  // Check subdomain
  if (!tenant) {
    const subdomain = hostname.split('.')[0];
    tenant = await db.tenants.findOne({ subdomain });
  }
  
  // Fallback to master
  if (!tenant) {
    tenant = await db.tenants.findOne({ tenant_type: 'master' });
  }
  
  req.tenant = tenant;
  req.db = db.withTenant(tenant.id); // Scoped DB queries
  next();
}
```

### 6.3 Repackaging Workflows

#### 6.3.1 New White-Label Client Onboarding

**Sales Process:**
1. **Discovery Call** → Understand client needs
2. **Demo Instance** → Create trial tenant with sample events
3. **Contract Signed** → Enterprise agreement
4. **Onboarding Kickoff** → 1-week implementation

**Technical Setup (Step-by-Step):**

**Step 1: Create Tenant Record**
```bash
Admin Panel → Tenants → Create New

Tenant Info:
- Brand Name: "Luxe Events Co."
- Company: "Luxe Events Company Ltd."
- Contact: john@luxeevents.com
- Domain: events.luxeevents.com (or custom)
- Tier: Enterprise
```

**Step 2: Branding Configuration**
Branding Setup:

Upload logo (SVG preferred, 500x500px)
Upload favicon (32x32px)
Primary color: #8B5CF6 (purple)
Secondary color: #EC4899 (pink)
Font: 'Playfair Display' (or custom web font)
Upload brand guidelines (PDF)


**Step 3: Feature Configuration**
Enable Features:
☑ Photo upload & gallery
☑ Lucky draw system
☑ Video uploads
☑ Custom templates (10 pre-loaded)
☑ API access (generate keys)
☑ SSO (configure SAML)
☐ Advanced analytics (add-on)

**Step 4: Domain Setup**
DNS Configuration:

Client adds CNAME: events.luxeevents.com → proxy.eventsmoments.com
We provision SSL certificate (Let's Encrypt)
Test access: https://events.luxeevents.com
Status: ✅ Active


**Step 5: Customization**
Custom CSS (optional):
.event-card {
border-radius: 16px;
box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
}
Custom Email Templates:

Welcome email
Event created notification
Photo moderation alerts
Winner announcement


**Step 6: Admin Training**
Training Session (1-2 hours):

Dashboard walkthrough
Create sample event
Test photo uploads
Run lucky draw demo
Q&A

Deliverables:

Training video recording
Admin user guide (PDF)
API documentation (if applicable)
Support contact info


**Step 7: Go-Live**
Launch Checklist:
☑ All tests passed
☑ Client approved branding
☑ Admin trained
☑ Support tickets system linked
☑ Billing set up
☐ First live event scheduled
Status: Ready for Production

#### 6.3.2 Tenant Administration Panel

**Super Admin Dashboard:**
Master Admin Panel → Tenants Overview
┌────────────────────────────────────────┐
│  Active Tenants: 12                    │
│  Total Events This Month: 847          │
│  Total Storage Used: 234 GB            │
│  MRR: $12,450                          │
└────────────────────────────────────────┘
Tenant List:
┌───────────────────────────────────────────────────────────┐
│ Brand Name      │ Domain               │ Status  │ MRR    │
├───────────────────────────────────────────────────────────┤
│ Luxe Events     │ events.luxeevents.com│ Active  │ $499   │
│ City Venue Co.  │ cityvenue.app.com    │ Active  │ $999   │
│ Wedding Bliss   │ events.weddingbliss..│ Trial   │ $0     │
└───────────────────────────────────────────────────────────┘
Actions per Tenant:

[View Dashboard] - See client's events & stats
[Edit Settings] - Modify features, branding
[View Billing] - Invoices, usage, charges
[Impersonate] - Log in as client admin (audit log)
[Suspend] - Temporarily disable (non-payment)
[Delete] - Permanent removal (30-day soft delete)


**Tenant Health Monitoring:**
System Alerts:
⚠️ Luxe Events - Storage 90% full (214/250 GB)
⚠️ City Venue - SSL cert expires in 14 days
✅ All other tenants healthy
Performance Metrics:

Avg. Event Creation Time: 3.2 minutes
Avg. Photo Upload Success Rate: 98.7%
Avg. Page Load Time: 1.4 seconds
Uptime (30 days): 99.97%


### 6.4 Scalability Considerations

#### 6.4.1 Database Sharding (Future)

**When Needed:** >100 tenants or >10M events

**Strategy:**
- Shard by `tenant_id` hash
- Large tenants get dedicated shards
- Master database holds tenant routing info

**Example:**
Shard 1: Tenants 1-25
Shard 2: Tenants 26-50
Shard 3: Tenant 51 (large client, dedicated)

#### 6.4.2 CDN & Caching

**Content Delivery:**
- CloudFlare CDN for static assets
- Edge caching for photo thumbnails
- Geo-distributed: Serve from nearest location

**Cache Strategy:**
Static Assets (Logo, CSS): Cache 1 year
Photo Thumbnails: Cache 30 days
Event Pages: Cache 5 minutes (bust on update)
API Responses: Cache 1 minute (tenant-specific)

#### 6.4.3 Auto-Scaling

**Compute:**
- Serverless functions (AWS Lambda / Vercel)
- Auto-scale based on request volume
- Cold start optimization (<500ms)

**Database:**
- Connection pooling (max 100 per instance)
- Read replicas for analytics queries
- Auto-failover for high availability

**Storage:**
- Unlimited cloud storage (S3/R2)
- Automatic tiering (hot → cold storage)
- Lifecycle policies (delete after retention period)

### 6.5 Tenant Billing & Usage Tracking

#### 6.5.1 Usage Metering

**Tracked Metrics:**
```javascript
Tenant Usage {
  tenant_id: string,
  billing_period: '2026-03',
  
  events_created: 47,
  total_photos_uploaded: 3,421,
  total_storage_gb: 12.4,
  total_lucky_draws: 47,
  api_calls: 8,234,
  
  overage: {
    events: 0 (limit: 100),
    storage: 0 (limit: 50 GB),
    api_calls: 0 (limit: 10,000)
  },
  
  estimated_cost: 499.00,
  overage_charges: 0.00,
  total_due: 499.00
}
```

**Overage Pricing:**
- Extra events: $5/event beyond plan
- Extra storage: $0.50/GB/month
- Extra API calls: $10/10,000 calls

**Billing Triggers:**
- Auto-invoice on 1st of month
- Email notification 3 days before billing
- Suspend service if payment fails (grace period: 7 days)

#### 6.5.2 Revenue Dashboard (Super Admin)
Master Admin → Revenue Analytics
┌────────────────────────────────────────┐
│  Monthly Recurring Revenue: $12,450    │
│  Growth: +15% MoM                      │
│  Churn Rate: 2.1%                      │
│  Avg. Revenue per Tenant: $1,037       │
└────────────────────────────────────────┘
Revenue Breakdown:

Enterprise Plans: $9,990 (80%)
Overage Charges: $1,460 (12%)
Add-ons: $1,000 (8%)

Top 5 Tenants by Revenue:

City Venue Co. - $1,999/mo
Wedding Bliss Inc. - $1,499/mo
Corporate Events Ltd. - $999/mo
...


---

## 7. User Flows & Journeys

### 7.1 Guest User Journey (Attending Event)
┌─────────────────────────────────────────┐
│          GUEST USER JOURNEY              │
└─────────────────────────────────────────┘
Step 1: Arrival at Event
↓
[See QR Code on Table/Screen]
↓
Scan with Phone Camera
↓
┌─────────────────────────────────────────┐
│  Redirect to: events.app.com/e/evt123   │
└─────────────────────────────────────────┘
↓
Step 2: Landing Page
↓
┌─────────────────────────────────────────┐
│  🎉 Sarah's Birthday Party              │
│  Saturday, March 15, 2026               │
│                                         │
│  [📸 View Photos] [🎲 Lucky Draw]     │
│                                         │
│  "127 moments captured!"                │
└─────────────────────────────────────────┘
↓
User Chooses Action:
↓
├─→ [View Photos] ──────┐
│                       ↓
│   ┌─────────────────────────────────┐
│   │  Photo Gallery (Masonry Grid)   │
│   │  [Photo 1] [Photo 2] [Photo 3] │
│   │  Scroll to see more...          │
│   └─────────────────────────────────┘
│                       ↓
│   User can:
│   - Tap photo → Full screen view
│   - React with emoji (❤️👏😂)
│   - Click [+ Upload] to add own
│
└─→ [Lucky Draw] ──────┐
↓
┌─────────────────────────────────┐
│  🎲 Lucky Draw                  │
│  34 people entered so far       │
│                                 │
│  [Enter Draw]                   │
│                                 │
│  Or wait for draw to start...   │
└─────────────────────────────────┘
↓
┌─────────────────────────────────┐
│  Take/Upload Selfie             │
│  [Selfie Preview]               │
│  Name: [_______]                │
│  ☐ Agree to display if winner   │
│  [Submit Entry]                 │
└─────────────────────────────────┘
↓
✅ Entry Confirmed!
"You're entered! Good luck 🍀"
Step 3: Upload Photos (If user chooses)
↓
Click [+ Upload Photo] Button
↓
┌─────────────────────────────────────────┐
│  Add Your Moment                        │
│  [📷 Take Photo] [🖼️ Choose Photos]   │
│                                         │
│  Selected: 0/5                          │
│  Your Name: [_______] (optional)        │
│  Caption: [___________]                 │
│  [Submit]                               │
└─────────────────────────────────────────┘
↓
Upload in Progress (2.3 MB → Compressed → Upload)
↓
✅ Success! "Photos uploaded!"
↓
Return to Gallery → See Own Photos (top of feed)
Step 4: Continue Browsing
↓

React to others' photos
Check if draw has started
Upload more (if under 5 limit)
Leave and return later (bookmark page)

Step 5: Lucky Draw Announcement
↓
[LIVE] Draw is starting! (Full screen)
↓
[Animation plays - 8 seconds]
↓
🎉 WINNER REVEALED 🎉
↓
If User Wins:
└─→ Notification on screen
"Congratulations [Your Name]!"
Organizer will contact you.
If User Doesn't Win:
└─→ "Better luck next time!"
See winner's name & photo
Journey Complete ✓
User can revisit page later to download photos (if organizer enables)

### 7.2 Organizer User Journey (Creating Event)
┌─────────────────────────────────────────┐
│        ORGANIZER USER JOURNEY            │
└─────────────────────────────────────────┘
Step 1: Sign Up / Log In
↓
Visit: app.com
↓
┌─────────────────────────────────────────┐
│  Welcome to EventsMoments               │
│  [Sign Up] [Log In]                     │
│  or                                     │
│  [Create Event as Guest] (Free tier)    │
└─────────────────────────────────────────┘
↓
Create Account:

Email + Password (or Google/Apple SSO)
Verify email
Choose plan (Free to start)
↓
Step 2: Dashboard (First Time)
↓
┌─────────────────────────────────────────┐
│  👋 Welcome, Sarah!                     │
│  You have 0 events.                     │
│                                         │
│  [+ Create Your First Event]            │
│                                         │
│  Quick Start Guide:                     │
│  1. Create event                        │
│  2. Customize look                      │
│  3. Generate QR code                    │
│  4. Share with guests                   │
└─────────────────────────────────────────┘
↓
Click [Create Event]
↓
Step 3: Event Creation Form
↓
┌─────────────────────────────────────────┐
│  Create New Event                       │
│                                         │
│  Event Name: [My 30th Birthday]         │
│  Date: [Mar 15, 2026] Time: [7:00 PM]  │
│  Type: [● Birthday ○ Wedding ○ Other]  │
│  Expected Guests: [~50]                 │
│                                         │
│  [Next: Customize]                      │
└─────────────────────────────────────────┘
↓
Step 4: Customization
↓
┌─────────────────────────────────────────┐
│  Customize Your Event                   │
│                                         │
│  Theme Color: [🎨 Purple]               │
│  Upload Logo: [Choose File] (Pro)       │
│  Frame Style: [Polaroid ▼] (3 options)  │
│                                         │
│  Features:                              │
│  ☑ Photo Upload                         │
│  ☑ Lucky Draw                           │
│  ☑ Allow Anonymous                      │
│  ☐ Require Moderation (Pro)             │
│                                         │
│  [Create Event]                         │
└─────────────────────────────────────────┘
↓
✅ Event Created!
↓
Step 5: Event Dashboard
↓
┌─────────────────────────────────────────┐
│  My 30th Birthday - March 15, 2026      │
│  Status: ● Active                       │
│                                         │
│  Stats: 0 visitors | 0 photos | 0 draws │
│                                         │
│  Event URL: app.com/e/evt_xyz123        │
│  [📱 View QR Code] [📋 Copy Link]       │
│                                         │
│  Tabs: [Overview] [Photos] [Draw] [⚙️]  │
└─────────────────────────────────────────┘
↓
Step 6: Download QR Code
↓
Click [View QR Code]
↓
┌─────────────────────────────────────────┐
│  Your Event QR Code                     │
│                                         │
│  [Large QR Code Image]                  │
│                                         │
│  Download:                              │
│  [PNG (300x300)] [PNG (600x600)]       │
│  [SVG (Vector)] [PDF (Printable)]      │
│                                         │
│  💡 Tip: Print and place on tables      │
│     or display on screen at venue       │
└─────────────────────────────────────────┘
↓
Download & Print QR Code
↓
Step 7: Event Day - Monitor Activity
↓
Event Dashboard (Real-time Updates)
↓
┌─────────────────────────────────────────┐
│  📊 Live Stats (Auto-refreshing)        │
│  👥 68 Visitors | 📸 127 Photos         │
│  🎲 34 Draw Entries                     │
│  Peak Time: 8:30 PM (23 uploads)        │
│                                         │
│  Recent Activity:                       │
│  • John uploaded 3 photos (2 mins ago)  │
│  • Emily entered lucky draw (5 mins)    │
│  • Anonymous uploaded photo (8 mins)    │
└─────────────────────────────────────────┘
↓
Switch to [Photos] Tab
↓
Review Uploaded Photos:
If moderation ON: Approve/Reject
If moderation OFF: Just monitor
Delete inappropriate content if needed
↓
Step 8: Run Lucky Draw
↓
Switch to [Lucky Draw] Tab
↓
┌─────────────────────────────────────────┐
│  🎲 Lucky Draw Control                  │
│  34 Entries Ready                       │
│                                         │
│  Winners: [● 1] Number                  │
│  Animation: [Spinning Wheel ▼]          │
│  Duration: [8 seconds]                  │
│                                         │
│  [Preview Animation]                    │
│  [🎬 START LUCKY DRAW]                  │
└─────────────────────────────────────────┘
↓
Click [START LUCKY DRAW]
↓
All Guest Screens Switch to Draw Mode
Animation Plays (8 seconds)
Winner Revealed! 🎉
↓
Organizer Dashboard:
↓
┌─────────────────────────────────────────┐
│  🏆 Winner Announced!                   │
│  John Smith                             │
│  [View Entry] [Contact] [Re-Draw]       │
│                                         │
│  [Draw Next Winner] (if multiple)       │
└─────────────────────────────────────────┘
↓
Step 9: Post-Event - Download Content
↓
Switch to [Download] Tab
↓
┌─────────────────────────────────────────┐
│  Export Event Content                   │
│  127 Photos | 34 Draw Entries           │
│                                         │
│  Format: [● ZIP] Quality: [● Medium]    │
│  Include: ☑ Metadata ☑ Names           │
│                                         │
│  Watermark: ● Yes (Free tier)           │
│  [Upgrade to Pro - Remove Watermark]    │
│                                         │
│  [Generate Download] (Est: 247 MB)      │
└─────────────────────────────────────────┘
↓
Wait for Processing (1-2 minutes)
↓
[Download ZIP] Link Ready (Valid 7 days)
↓
✅ Content Downloaded & Saved
↓
Step 10: Review & Plan Next Event
↓
View Analytics Report (Pro feature prompt)
Consider Upgrading for Next Event
Leave Feedback
↓
Journey Complete ✓
Event can be archived or deleted


### 7.3 Enterprise Client Journey (White-Label Setup)
┌─────────────────────────────────────────┐
│      ENTERPRISE CLIENT JOURNEY           │
│      (Event Management Company)          │
└─────────────────────────────────────────┘
Step 1: Sales & Demo
↓
Contact Sales Team
↓
Schedule Demo Call
↓
See Demo Instance with Sample Events
↓
Discuss Requirements:

Branding needs
Expected event volume (100+ events/year)
Custom features
Integration needs
↓
Receive Proposal & Quote
↓
Step 2: Contract & Onboarding
↓
Sign Enterprise Agreement
Monthly: $999/mo or Custom pricing
↓
Onboarding Kickoff Call (Week 1)
↓
Step 3: Technical Setup
↓
Our Team Sets Up:
↓
┌─────────────────────────────────────────┐
│  White-Label Configuration              │
│  ✓ Tenant record created                │
│  ✓ Brand: "Luxe Events Co."            │
│  ✓ Domain: events.luxeevents.com        │
│  ✓ Logo & colors applied                │
│  ✓ Custom email templates               │
│  ✓ SSL certificate provisioned          │
│  ✓ API keys generated                   │
│  ✓ Admin accounts created (5 users)     │
└─────────────────────────────────────────┘
↓
Client Receives:
Login credentials
Admin training session (2 hours)
Documentation package
Support contact
↓
Step 4: Test Phase
↓
Client Creates Test Events (Week 2)
↓
┌─────────────────────────────────────────┐
│  Luxe Events - Admin Dashboard          │
│  (Fully Branded)                        │
│                                         │
│  Active Events: 3 (Test)                │
│  [+ Create Event]                       │
│                                         │
│  Test Event 1: Sample Wedding           │
│  Test Event 2: Corporate Gala           │
│  Test Event 3: Birthday Party           │
└─────────────────────────────────────────┘
↓
Test Workflows:
Create events with their branding
Upload test photos
Run lucky draws
Test moderation
Download exports
↓
Feedback & Adjustments
↓
Step 5: Go-Live
↓
First Real Client Event Scheduled
↓
┌─────────────────────────────────────────┐
│  Real Event: Johnson Wedding            │
│  Date: March 20, 2026                   │
│  Expected Guests: 150                   │
│  Client: Mr. & Mrs. Johnson             │
│                                         │
│  QR Codes printed on table cards ✓      │
│  Event link shared with couple ✓        │
│  Staff trained on moderation ✓          │
└─────────────────────────────────────────┘
↓
Event Day Success! 🎉
142 guests participated
387 photos collected
Lucky draw: Bouquet toss winner announced
Client delighted with experience
↓
Step 6: Scaling Operations
↓
Month 1-3: 15 events hosted
Month 4-6: 40 events hosted
Month 7-12: 120+ events hosted
↓
Client Benefits:
✅ Differentiated service offering
✅ Higher client satisfaction scores
✅ Increased booking rates
✅ Efficient photo collection
✅ Professional presentation
↓
Step 7: Ongoing Support
↓
Monthly Business Review:
Usage stats
Client feedback
Feature requests
Roadmap updates
↓
Continuous Improvement:
New templates added
Custom features developed
Integration expansions
↓
Relationship Status: 🌟 Happy Long-term Client
Renewal Rate: High
Referrals: Generate new enterprise leads


---

## 8. Technical Requirements

### 8.1 Technology Stack

#### 8.1.1 Frontend

**Core Framework:**
- **React 18+** (or Next.js 14+ for SSR/SSG)
- TypeScript for type safety
- Tailwind CSS for styling

**State Management:**
- React Context + useReducer (simple state)
- Zustand or Jotai (complex state)
- TanStack Query (React Query) for server state

**Real-time:**
- **Socket.io Client** or **Supabase Realtime**Continue10:18 PM
Fallback: Polling every 5 seconds

File Upload:

react-dropzone for drag-drop
Browser-image-compression for client-side compression
Progress tracking with axios

UI Components:

Headless UI or Radix UI (accessible)
Framer Motion (animations)
React-Confetti (celebrations)

QR Code:

qrcode.react or react-qr-code
Support for logo embedding

Image Display:

React-Photo-Gallery (masonry layout)
Yet Another React Lightbox (fullscreen view)
Lazy loading with Intersection Observer

PWA Support:

Service Worker for offline capability
Web App Manifest
Add to Home Screen prompt

8.1.2 Backend
Runtime:

Node.js 20+ with Express or Fastify
OR Serverless Functions (Vercel, AWS Lambda)

API Style:

REST API for CRUD operations
WebSocket for real-time updates
GraphQL (optional, for complex queries)

Authentication:

JWT tokens (access + refresh)
OAuth 2.0 (Google, Apple SSO)
Magic Links for passwordless login

Image Processing:

Sharp (Node.js) for compression/resizing
FFmpeg for video processing (future)
Background jobs via Bull Queue (Redis)

Content Moderation:

AWS Rekognition or Google Cloud Vision
Perspective API (Google) for text toxicity
Custom profanity filter library

Email/SMS:

SendGrid or AWS SES (email)
Twilio (SMS notifications)
Template engine: Handlebars or Mjml

8.1.3 Database
Primary Database:

PostgreSQL 15+ (relational data)
Hosted: Supabase, Neon, or AWS RDS
Connection pooling: PgBouncer

Schema Design:
sql-- Core Tables
tenants
users
events
photos
lucky_draw_entries
winners
reactions
```

**Indexes:**
- `events(tenant_id, status, event_date)`
- `photos(event_id, created_at)`
- `lucky_draw_entries(event_id, entry_timestamp)`

**Full-Text Search:**
- PostgreSQL `tsvector` for searching photos/events
- OR **Algolia** for advanced search (Premium)

#### 8.1.4 Storage

**Object Storage:**
- **AWS S3** or **Cloudflare R2** (S3-compatible)
- Folder structure: `/{tenant_id}/{event_id}/{photo_id}_[size].jpg`

**CDN:**
- **CloudFlare** (global CDN + DDoS protection)
- Signed URLs for private content
- Image optimization: Auto-WebP conversion

**Caching:**
- **Redis** for session storage, rate limiting, job queues
- **CloudFlare Cache** for static assets
- **API response caching** (short TTL: 1-5 min)

#### 8.1.5 Infrastructure

**Hosting:**
- **Vercel** or **Netlify** (Frontend + Serverless)
- **AWS** or **Google Cloud** (Backend services)
- **Docker** containers for self-hosting option

**CI/CD:**
- **GitHub Actions** for automated testing & deployment
- **Vercel** auto-deploy on git push
- Staging + Production environments

**Monitoring:**
- **Sentry** (error tracking)
- **LogRocket** or **FullStory** (session replay)
- **Datadog** or **Grafana** (metrics)
- **UptimeRobot** (uptime monitoring)

**Security:**
- **AWS WAF** (Web Application Firewall)
- **OWASP** security headers
- **Rate limiting** (Redis-based)
- **DDoS protection** (CloudFlare)

### 8.2 API Specifications

#### 8.2.1 Core API Endpoints

**Authentication:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

**Events:**
```
POST   /api/events                    # Create event
GET    /api/events                    # List user's events
GET    /api/events/:id                # Get event details
PATCH  /api/events/:id                # Update event
DELETE /api/events/:id                # Delete event
GET    /api/events/:id/stats          # Real-time stats
POST   /api/events/:id/end            # End event
```

**Photos:**
```
POST   /api/events/:eventId/photos    # Upload photos
GET    /api/events/:eventId/photos    # List photos (paginated)
GET    /api/photos/:id                # Get single photo
DELETE /api/photos/:id                # Delete photo (admin)
PATCH  /api/photos/:id/approve        # Approve (moderation)
PATCH  /api/photos/:id/reject         # Reject (moderation)
POST   /api/photos/:id/react          # Add reaction
```

**Lucky Draw:**
```
POST   /api/events/:eventId/lucky-draw/entries  # Submit entry
GET    /api/events/:eventId/lucky-draw/entries  # List entries
POST   /api/events/:eventId/lucky-draw/start    # Start draw (admin)
GET    /api/events/:eventId/lucky-draw/winner   # Get winner
POST   /api/events/:eventId/lucky-draw/redraw   # Re-draw
```

**Download:**
```
POST   /api/events/:eventId/export    # Generate download
GET    /api/exports/:id/status        # Check export status
GET    /api/exports/:id/download      # Download ZIP
```

**Admin (Tenant Management):**
```
POST   /api/admin/tenants             # Create tenant
GET    /api/admin/tenants             # List tenants
GET    /api/admin/tenants/:id         # Get tenant
PATCH  /api/admin/tenants/:id         # Update tenant
DELETE /api/admin/tenants/:id         # Delete tenant
GET    /api/admin/analytics           # Platform analytics
8.2.2 WebSocket Events
Client → Server:
javascript// Join event room
socket.emit('join_event', { eventId: 'evt_123' });

// Submit photo (alternative to HTTP)
socket.emit('upload_photo', { eventId, photoData });

// Submit reaction
socket.emit('add_reaction', { photoId, emoji });
Server → Client:
javascript// New photo uploaded
socket.on('new_photo', (photo) => {
  // Add to gallery
});

// Stats updated
socket.on('stats_update', (stats) => {
  // Update counters
});

// Draw started
socket.on('draw_started', (config) => {
  // Switch to draw mode
});

// Winner announced
socket.on('draw_winner', (winner) => {
  // Show winner screen
});

// Photo approved/rejected (for uploader)
socket.on('photo_moderated', ({ photoId, status }) => {
  // Notify user
});
```

### 8.3 Performance Requirements

**Page Load:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >90

**API Response:**
- List endpoints: <200ms (p95)
- Upload endpoint: <2s for 5MB photo
- Real-time latency: <100ms

**Scalability:**
- Support 1,000 concurrent users per event
- Handle 10,000 events simultaneously
- Process 100 photo uploads/second

**Availability:**
- Uptime: 99.9% (8.76 hours downtime/year)
- RTO (Recovery Time Objective): <1 hour
- RPO (Recovery Point Objective): <15 minutes

**Storage:**
- Support up to 10 PB total storage
- 99.999999999% (11 9's) durability (S3)

---

## 9. UI/UX Specifications

### 9.1 Design System

#### 9.1.1 Color Palette (Master Brand)

**Primary Colors:**
```
Primary:   #8B5CF6 (Purple-500)
Secondary: #EC4899 (Pink-500)
Accent:    #F59E0B (Amber-500)
```

**Neutral Colors:**
```
Gray-50:   #F9FAFB
Gray-100:  #F3F4F6
Gray-200:  #E5E7EB
Gray-300:  #D1D5DB
Gray-500:  #6B7280
Gray-700:  #374151
Gray-900:  #111827
```

**Semantic Colors:**
```
Success:   #10B981 (Green-500)
Warning:   #F59E0B (Amber-500)
Error:     #EF4444 (Red-500)
Info:      #3B82F6 (Blue-500)
9.1.2 Typography
Font Stack:
cssPrimary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Headings: 'Cal Sans' or 'Clash Display' (modern, geometric)
Monospace: 'JetBrains Mono', monospace (for codes)
```

**Type Scale:**
```
Heading 1: 48px / 56px (3rem / 3.5rem) - Bold
Heading 2: 36px / 44px (2.25rem / 2.75rem) - Bold
Heading 3: 30px / 36px (1.875rem / 2.25rem) - Semibold
Heading 4: 24px / 32px (1.5rem / 2rem) - Semibold
Heading 5: 20px / 28px (1.25rem / 1.75rem) - Medium

Body Large: 18px / 28px (1.125rem / 1.75rem) - Regular
Body: 16px / 24px (1rem / 1.5rem) - Regular
Body Small: 14px / 20px (0.875rem / 1.25rem) - Regular
Caption: 12px / 16px (0.75rem / 1rem) - Regular
```

#### 9.1.3 Spacing System

**Base Unit: 4px** (0.25rem)
```
Space-1:  4px  (0.25rem)
Space-2:  8px  (0.5rem)
Space-3:  12px (0.75rem)
Space-4:  16px (1rem)
Space-5:  20px (1.25rem)
Space-6:  24px (1.5rem)
Space-8:  32px (2rem)
Space-10: 40px (2.5rem)
Space-12: 48px (3rem)
Space-16: 64px (4rem)
Space-20: 80px (5rem)
```

#### 9.1.4 Component Library

**Buttons:**
```
Primary:   Purple bg, white text, hover: darker purple
Secondary: Gray bg, gray text, hover: light gray
Outline:   Transparent bg, purple border, purple text
Ghost:     Transparent bg, purple text, hover: light purple bg
Danger:    Red bg, white text, hover: darker red

Sizes:
- Small: 32px height, 12px padding, 14px text
- Medium: 40px height, 16px padding, 16px text
- Large: 48px height, 20px padding, 18px text
```

**Cards:**
```
Base card:
- Background: White
- Border: 1px Gray-200
- Border Radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px

Hover state:
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Transform: translateY(-2px)
- Transition: 200ms ease
```

**Inputs:**
```
Text input:
- Height: 40px
- Border: 1px Gray-300
- Border Radius: 8px
- Padding: 12px
- Focus: Purple-500 ring (2px offset)

States:
- Default
- Hover (border Gray-400)
- Focus (purple ring)
- Error (red border + ring)
- Disabled (gray bg, reduced opacity)
```

### 9.2 Responsive Design

**Breakpoints:**
```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
Wide:    > 1280px
```

**Layout Guidelines:**
- Mobile: Single column, stacked elements
- Tablet: 2-column grid where appropriate
- Desktop: 3-4 column grid, sidebar layouts
- Wide: Max-width container (1280px)

**Mobile-First Approach:**
- Design for mobile first
- Enhance for larger screens
- Touch-friendly tap targets (44x44px min)
- Swipe gestures where applicable

### 9.3 Accessibility

**WCAG 2.1 Level AA Compliance:**
- Color contrast ratio: 4.5:1 (text), 3:1 (UI elements)
- Keyboard navigation: All interactive elements
- Screen reader support: Semantic HTML, ARIA labels
- Focus indicators: Visible on all focusable elements
- Skip links: "Skip to main content"

**Inclusive Design:**
- Support dark mode (system preference)
- Reduce motion option (respect prefers-reduced-motion)
- Alt text for all images
- Captions for videos
- Form labels and error messages

### 9.4 Animation Guidelines

**Micro-interactions:**
```
Button hover: 150ms ease
Card hover: 200ms ease-out
Page transitions: 300ms ease-in-out
Modal open/close: 250ms ease
Toast notifications: Slide in 200ms, hold 3s, fade out 200ms
```

**Loading States:**
- Skeleton screens for content loading
- Spinners for actions (uploading, processing)
- Progress bars for multi-step processes

**Celebration Animations:**
- Confetti for winners (3-second burst)
- Success checkmark (scale + fade in)
- Photo upload success (bounce in)

**Performance:**
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Respect `prefers-reduced-motion`

---

## 10. Security & Privacy

### 10.1 Security Measures

#### 10.1.1 Authentication & Authorization

**User Authentication:**
- Passwords: bcrypt hashing (cost factor: 12)
- JWT tokens: RS256 algorithm
- Access token: 15-minute expiry
- Refresh token: 7-day expiry, HTTP-only cookie
- Multi-factor authentication (Premium+)

**Authorization Levels:**
```
Guest (Unauthenticated):
- View event page
- Upload photos (rate-limited)
- Enter lucky draw
- View public galleries

Organizer (Authenticated):
- All guest permissions
- Create/edit/delete own events
- Moderate content
- Download exports
- View analytics

Admin (Per-Tenant):
- All organizer permissions
- Manage users
- View all tenant events
- Billing management

Super Admin (Platform):
- All admin permissions
- Manage tenants
- Platform analytics
- System configuration
```

#### 10.1.2 Data Protection

**Encryption:**
- At rest: AES-256 encryption (S3, database)
- In transit: TLS 1.3 (HTTPS only)
- Sensitive fields: Additional encryption (contact info)

**Personal Data Handling:**
- IP addresses: Hashed before storage
- Emails: Encrypted, never shared
- Photos: Option to blur faces (Premium)
- EXIF data: Stripped before storage

**Data Retention:**
```
Free tier: 7 days
Pro tier: 30 days
Premium: 90 days
Enterprise: Custom (up to 1 year)

Post-retention: Soft delete → 30 days → Hard delete
```

#### 10.1.3 Input Validation & Sanitization

**Server-Side Validation:**
- All inputs validated against schema
- SQL injection prevention: Parameterized queries
- XSS prevention: HTML sanitization
- File upload validation:
  - Magic number checking (not just extension)
  - File size limits
  - Virus scanning (ClamAV)

**Rate Limiting:**
```
API Endpoints:
- Auth: 5 requests/minute per IP
- Upload: 10 requests/hour per fingerprint
- General: 100 requests/minute per IP

Escalation:
- Soft limit: Slow down responses
- Hard limit: 429 error + CAPTCHA
- Persistent abuse: IP ban (24 hours)
```

**CAPTCHA:**
- Triggered after 3 failed attempts
- Use: hCaptcha or Cloudflare Turnstile
- Accessibility: Audio alternative

#### 10.1.4 Content Security

**Content Moderation:**
- AI scanning (AWS Rekognition)
- Profanity filter (BadWords library + custom)
- NSFW detection threshold: 85% confidence
- Violence/gore detection
- Hate symbol detection

**Image Watermarking (Free tier):**
- Semi-transparent logo overlay
- Bottom-right corner
- Removal: Requires Pro upgrade

**DRM (Digital Rights Management):**
- Disable right-click on images (basic)
- Serve low-res for preview, full-res on download (Premium)
- Optional: Hidden digital fingerprint in images

### 10.2 Privacy & Compliance

#### 10.2.1 GDPR Compliance (EU)

**User Rights:**
1. **Right to Access**: Download all personal data
2. **Right to Rectification**: Edit profile/data
3. **Right to Erasure**: Delete account + all data
4. **Right to Portability**: Export data (JSON)
5. **Right to Object**: Opt-out of analytics

**Implementation:**
```
User Dashboard → Privacy Settings

[Export My Data] → Downloads JSON file
[Delete My Account] → Confirmation + 30-day grace period
[Privacy Preferences] → Toggle analytics, marketing
```

**Data Processing:**
- Privacy Policy: Clear, accessible, versioned
- Cookie Consent: Banner with granular controls
- Data Processing Agreement (DPA) for Enterprise

#### 10.2.2 CCPA Compliance (California)

**"Do Not Sell My Personal Information":**
- Prominent link in footer
- Opt-out mechanism (no account required)
- Confirmation within 15 days

**Data Disclosure:**
- Categories of data collected
- Purpose of collection
- Third parties data shared with
- Retention periods

#### 10.2.3 Children's Privacy (COPPA)

**Age Restrictions:**
- Users must be 13+ (US), 16+ (EU)
- Age gate on sign-up
- Parental consent mechanism (if needed)

**If Minors Present at Event:**
- Organizer responsibility to inform parents
- Option: Disable facial recognition
- Terms: Guardian consent assumed

#### 10.2.4 Terms of Service & Content Policy

**User Responsibilities:**
- Upload only content they own/have rights to
- No copyrighted material without permission
- No illegal, harmful, or offensive content
- Respect others' privacy (no upskirt, etc.)

**Platform Rights:**
- Remove violating content without notice
- Suspend/ban users for repeated violations
- Use uploaded content for marketing (with permission)

**Organizer Responsibilities:**
- Inform guests about photo collection
- Obtain necessary permissions (venue, etc.)
- Comply with local laws

**Liability:**
- Platform not liable for user-generated content
- Indemnification clause for organizers
- DMCA takedown procedure

---

## 11. Monetization Strategy

*(Detailed in Section 3 above - incorporated here for completeness)*

### 11.1 Pricing Tiers

#### FREE Tier
- **Price**: $0
- **Limits**: 1 event, 50 photos, 30 draw entries, 24hr event, 7-day storage
- **Features**: Basic templates, QR code, basic draw, watermarked downloads
- **Target**: Personal events, trial users

#### PRO Tier
- **Price**: $9.99/event or $29.99/month (5 events)
- **Limits**: 500 photos, 200 draw entries, 7-day event, 30-day storage
- **Features**: No watermark, custom branding, 20+ templates, multiple winners, analytics, moderation
- **Target**: Regular hosts, small businesses

#### PREMIUM Tier
- **Price**: $49.99/event or $99.99/month (unlimited events)
- **Limits**: Unlimited photos/entries, 30-day event, 90-day storage
- **Features**: Everything in Pro + white-label option, custom domain, advanced analytics, API access, priority support
- **Target**: Professional planners, frequent hosts

#### ENTERPRISE Tier
- **Price**: Custom (starting $499/month)
- **Limits**: Unlimited everything, custom retention
- **Features**: Full white-label, dedicated infrastructure, custom development, SLA, multi-admin, SSO, on-premise option
- **Target**: Event companies, venues, large corporations

### 11.2 Revenue Streams

1. **Subscription Revenue** (Primary):
   - Monthly recurring revenue (MRR)
   - Annual plans (20% discount for upfront payment)
   - Overage charges

2. **One-Time Event Purchases**:
   - Pay-per-event for occasional users
   - No commitment, instant access

3. **Add-Ons & Marketplace**:
   - Premium templates ($2-10 each)
   - Extended storage ($5-20/month)
   - Custom QR designs ($5-15)
   - Video montage service ($29-99)

4. **Print Services** (Partner Commission):
   - Photo books, prints, canvases (20-30% commission)
   - Partner with Shutterfly, Printful, etc.

5. **White-Label Licensing** (Enterprise):
   - Setup fee: $2,000-5,000
   - Monthly fee: $499-2,999
   - Custom development: Hourly rate

6. **API Access** (Premium/Enterprise):
   - API calls beyond free tier
   - Webhook integrations
   - Custom endpoints

### 11.3 Conversion Funnels

**Free → Pro:**
- Trigger: Hit 40/50 photo limit
- Prompt: "Upgrade for unlimited photos + remove watermark"
- Offer: "First month 50% off"

**Pro → Premium:**
- Trigger: Host 5 events in a month
- Prompt: "You're a power user! Save with Premium"
- Offer: "Try Premium free for 14 days"

**Premium → Enterprise:**
- Trigger: Host 20+ events, multiple admins
- Prompt: "Need white-label? Let's talk Enterprise"
- Action: Schedule sales call

### 11.4 Financial Projections

#### Year 1 (Conservative)

| Month | Free Users | Pro | Premium | Enterprise | MRR |
|-------|------------|-----|---------|------------|-----|
| 1-3 | 100 | 10 | 2 | 0 | $499 |
| 4-6 | 500 | 50 | 10 | 0 | $3,400 |
| 7-9 | 1,500 | 150 | 30 | 1 | $10,400 |
| 10-12 | 3,000 | 300 | 60 | 2 | $20,800 |

**Year 1 Total ARR**: ~$100,000

#### Year 2-3 Growth
- **Year 2 ARR**: $500,000 (5x growth)
- **Year 3 ARR**: $2,000,000 (4x growth)

**Key Drivers:**
- SEO & content marketing
- Partnership with event companies
- Referral program momentum
- Enterprise client acquisitions

---

## 12. Analytics & Metrics

### 12.1 Platform Metrics (Super Admin)

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate (monthly/annual)
- Conversion Rate (Free → Paid)
- Net Promoter Score (NPS)

**Usage Metrics:**
- Total registered users
- Active users (DAU/MAU)
- Total events created
- Total photos uploaded
- Total storage used
- API calls made

**Performance Metrics:**
- Avg. page load time
- API response times (p50, p95, p99)
- Error rate
- Uptime percentage
- CDN hit rate

### 12.2 Tenant Metrics (Enterprise Client Dashboard)

**Event Analytics:**
- Events hosted (this month/all-time)
- Total participants across events
- Avg. photos per event
- Avg. engagement rate

**Content Analytics:**
- Top performing events (by participation)
- Most active time periods
- Popular photo categories
- Reaction distribution

**User Behavior:**
- Avg. session duration
- Bounce rate
- Device breakdown (mobile/tablet/desktop)
- Geographic distribution

### 12.3 Event Metrics (Organizer Dashboard)

**Real-Time Stats:**
```
Current Visitors: 42
Total Visits: 156
Photos Uploaded: 127
Draw Entries: 34
Reactions Given: 456
```

**Engagement Timeline:**
- Hourly upload chart
- Peak activity time
- Upload velocity

**Content Breakdown:**
```
Top Contributors:
1. John (8 photos)
2. Emily (6 photos)
3. Sarah (5 photos)

Most Liked Photos:
1. Photo #42 (❤️ 24)
2. Photo #17 (❤️ 19)
3. Photo #88 (❤️ 15)
Demographics (Premium+):

Device types (iOS 45%, Android 40%, Desktop 15%)
Upload sources (Camera 60%, Gallery 40%)
Participation rate (guests who uploaded / total visitors)

12.4 Analytics Implementation
Tools:

Google Analytics 4 (web analytics)
Mixpanel or Amplitude (product analytics)
Segment (data pipeline)
Metabase or Retool (internal dashboards)

Event Tracking:
javascript// Key Events to Track
- event_created
- photo_uploaded
- draw_entered
- draw_started
- winner_announced
- export_generated
- upgrade_clicked
- payment_completed
Custom Dashboards:

Organizer dashboard (real-time + historical)
Tenant dashboard (multi-event aggregation)
Super admin dashboard (platform-wide)


13. Launch Strategy & Roadmap
13.1 Pre-Launch (Months -3 to 0)
Month -3: Foundation
Week 1-2: Core Development

Set up repository & infrastructure
Implement authentication system
Build event creation flow
Database schema implementation

Week 3-4: Photo System

Upload functionality
Image compression
Storage integration (S3/R2)
Gallery display (masonry layout)

Month -2: Features
Week 1-2: Lucky Draw

Entry system
Animation implementations (3 styles)
Winner selection algorithm
Admin controls

Week 3-4: Admin Dashboard

Event management interface
Real-time stats
Moderation queue
Bulk download

Month -1: Polish & Testing
Week 1-2: UI/UX Refinement

Mobile responsiveness
Animations & transitions
Accessibility audit
Cross-browser testing

Week 3-4: Beta Testing

Recruit 20 beta testers
Host 10 real test events
Collect feedback
Fix critical bugs

Week 4: Launch Prep

Marketing website
Documentation
Pricing pages
Support infrastructure

13.2 Launch (Month 0)
Week 1: Soft Launch

Launch to beta testers + friends & family
Limited marketing (social media only)
Monitor closely for issues
Rapid iteration based on feedback

Week 2: Public Launch

Product Hunt launch
Press release
Social media campaign
Email to waitlist (if applicable)

Week 3-4: Growth

Content marketing begins
SEO optimization
Partnership outreach
Customer support scaling

13.3 Post-Launch Roadmap
Phase 1: Months 1-3 (Validation)
Goals:

500 registered users
50 paying customers
1,000 events hosted
Product-market fit validation

Features:

P1 features (reactions, templates)
Email notifications
Basic analytics
Payment processing (Stripe)

Phase 2: Months 4-6 (Growth)
Goals:

2,000 users
200 paying customers
5,000 events
First Enterprise client

Features:

Advanced analytics
Multi-language support (Spanish, French)
Video upload support (Beta)
API v1 launch
Slideshow mode

Phase 3: Months 7-12 (Scale)
Goals:

10,000 users
1,000 paying customers
25,000 events
5 Enterprise clients

Features:

Mobile app (React Native)
White-label customization UI
Advanced integrations (Zapier)
Photo booth mode
AI-powered highlights

Phase 4: Year 2 (Expansion)
Goals:

50,000 users
5,000 paying customers
100,000+ events
20 Enterprise clients
International expansion

Features:

Video montage AI generation
Social media integrations
Advanced face recognition (opt-in)
Marketplace for templates
B2B sales team

13.4 Marketing Strategy
Content Marketing
Blog Topics:

"10 Creative Ways to Engage Wedding Guests"
"How to Capture Authentic Event Moments"
"Event Photography vs. Guest Photo Sharing"
"Lucky Draw Ideas for Corporate Events"

SEO Keywords:

"event photo sharing app"
"wedding photo booth alternative"
"lucky draw software"
"event engagement ideas"

Social Media
Platforms:

Instagram (visual showcase)
Twitter/X (product updates)
LinkedIn (B2B, Enterprise)
TikTok (event tips, behind-the-scenes)

Content:

User-generated content (with permission)
Event success stories
Tips & tricks
Feature announcements

Partnerships
Target Partners:

Event planning companies
Wedding venues
Corporate event organizers
Photography studios
Party supply companies

Partnership Models:

Affiliate program (20% commission)
Co-marketing campaigns
White-label reselling
Integration partnerships

Paid Advertising
Channels:

Google Ads (search: "event photo app")
Facebook/Instagram Ads (targeting event planners)
LinkedIn Ads (B2B, Enterprise)
Reddit (r/weddingplanning, r/events)

Budget Allocation (Month 1-3):

Google Ads: $2,000/month
Social Media: $1,500/month
Content Creation: $1,000/month
Partnerships: $500/month
Total: $5,000/month

PR & Media

Press kit with screenshots, logo, founder story
Outreach to event industry publications
Guest posts on event planning blogs
Podcast interviews (event planning shows)


14. Risk Assessment
14.1 Technical Risks
RiskProbabilityImpactMitigationServer DowntimeMediumHigh- Multi-region deployment- Auto-scaling- 99.9% SLA with monitoringData LossLowCritical- Automated daily backups- Point-in-time recovery- Multi-region replicationSecurity BreachMediumCritical- Regular security audits- Penetration testing- Bug bounty program- Incident response planCDN FailureLowMedium- Multi-CDN strategy- Fallback to origin serverContinue10:21 PM| Rate Limiting Bypass | Medium | Medium | - Multi-layer approach<br>- CAPTCHA escalation<br>- IP banning |
| Image Storage Costs | High | Medium | - Aggressive compression<br>- Tiered storage<br>- Delete old events<br>- Pass costs to users (Premium) |
14.2 Business Risks
RiskProbabilityImpactMitigationLow User AdoptionMediumHigh- Beta testing for PMF- Free tier to reduce barrier- Strong marketing launchHigh CAC, Low LTVMediumHigh- Optimize conversion funnel- Improve retention- Upsell strategiesCompetitor LaunchHighMedium- Build moat (features, brand)- Focus on UX excellence- Fast iterationSeasonal DemandHighLow- B2B Enterprise (steady)- Diversify event types- International expansion (different seasons)Payment FraudLowMedium- Stripe Radar (fraud detection)- Manual review high-risk- Chargeback monitoring
14.3 Legal & Compliance Risks
RiskProbabilityImpactMitigationGDPR ViolationLowHigh- Privacy by design- DPO consultation- Regular compliance auditsCopyright ClaimsMediumMedium- DMCA process- User terms clarity- Content moderationChild Privacy (COPPA)LowHigh- Age verification- Parental consent mechanism- Terms enforcementTerms ViolationMediumLow- Clear ToS- Moderation system- Ban mechanisms
14.4 Operational Risks
RiskProbabilityImpactMitigationSupport OverloadHighMedium- Comprehensive documentation- Chatbot for common issues- Tiered supportKey Person DependencyMediumHigh- Document everything- Cross-training- Hire redundancyVendor Lock-inLowMedium- Use open standards- Abstraction layers- Exit strategies
14.5 Contingency Plans
Scenario 1: Major Outage During Peak Event

Activate incident response team
Switch to backup infrastructure
Communicate with affected organizers
Post-mortem and compensation (credit)

Scenario 2: Security Breach

Isolate affected systems
Engage security firm
Notify affected users (legally required)
Implement fixes
Public transparency report

Scenario 3: Viral Growth (Good Problem)

Emergency scaling (add servers)
Pause non-critical features
Prioritize core functionality
Hire support team quickly


15. Success Criteria
15.1 MVP Success (Month 3)
Must Achieve:

✅ 100+ registered organizers
✅ 500+ events created
✅ 10,000+ photos uploaded
✅ 5% free-to-paid conversion
✅ NPS score >30
✅ <5% bug rate (critical issues)

Nice to Have:

1 Enterprise client signed
Featured on Product Hunt (top 5)
50+ organic social mentions

15.2 Year 1 Success
Revenue:

$100,000 ARR
500 paying customers
$200 average LTV
<$150 CAC (LTV:CAC > 1.3)

Usage:

10,000+ events hosted
50,000+ users (registered + guests)
500,000+ photos uploaded
95% uptime

Market:

2 Enterprise clients
10 partnership agreements
1,000+ organic search visits/month

15.3 Long-Term Vision (3 Years)
Mission:
"To become the #1 platform for capturing and celebrating event moments worldwide"
Metrics:

$2M+ ARR
50 Enterprise clients
500,000+ events hosted
Present in 10+ countries
100,000+ paying customers

Product:

Mobile apps (iOS + Android)
20+ integrations
AI-powered features (auto-highlights, face grouping)
Video support
AR experiences


16. Appendix
16.1 Glossary
Terms:

Event: A single occurrence (party, wedding, etc.) with unique URL/QR code
Organizer: User who creates and manages events
Guest: Attendee who participates (uploads photos, enters draw)
Tenant: White-label client (Enterprise) with their own branding
Fingerprint: Unique browser/device identifier for rate limiting
Moderation: Review process for uploaded content before public display
Artifact: Photo, video, or other content uploaded to event

16.2 Technical Glossary

CDN: Content Delivery Network (CloudFlare)
S3: Amazon Simple Storage Service (object storage)
JWT: JSON Web Token (authentication)
WebSocket: Bi-directional real-time communication protocol
PWA: Progressive Web App (works offline, installable)
SSO: Single Sign-On (login with Google, etc.)
API: Application Programming Interface
SLA: Service Level Agreement (uptime guarantee)

16.3 Competitor Analysis
CompetitorStrengthsWeaknessesOur AdvantagePhotobox / Photo Booth AppsEstablished, featuresExpensive, requires hardwareFully software, no hardware needed, cheaperGoogle Photos Shared AlbumsFree, familiarNo customization, no gamification, cluttered UICurated experience, branded, lucky drawInstagram HashtagsSocial, freeNot private, poor organizationPrivate, organized, event-specificWeTransfer / DropboxSimple sharingNot event-focused, no engagementPurpose-built, engaging
Our Unique Value:

Zero friction (QR → instant access)
Gamification (lucky draw)
White-label ready (B2B opportunity)
Real-time + beautiful UI
All-in-one solution

16.4 User Research Insights
From Beta Testing (Sample Feedback):
Positive:

"So easy! Just scan and upload"
"Loved the lucky draw animation - guests were excited"
"Finally got all the photos in one place"
"The gallery looked professional"

Areas for Improvement:

"Wish I could edit photos before uploading" → Future feature
"Ran out of the 5-photo limit too quickly" → Encourage upgrade
"Would be nice to tag people" → Premium feature idea
"Loading was slow on bad WiFi" → Optimize compression

16.5 FAQ (Frequently Asked Questions)
For Organizers:
Q: How do I share the event with my guests?
A: Print the QR code on table cards, display it on screens, or share the link via text/email/social media.
Q: Can I moderate photos before they appear?
A: Yes! Enable "Require Moderation" in event settings (Pro tier+).
Q: What happens to photos after the event?
A: They're stored for 7-90 days (depending on tier), then deleted unless you download them.
Q: Can I customize the look?
A: Free: 3 color presets. Pro+: Custom colors, logo, templates.
Q: Is there a limit on guest uploads?
A: Each guest can upload up to 5 photos. You can adjust this (Premium tier).
For Guests:
Q: Do I need an app?
A: No! Just scan the QR code with your phone camera - opens in browser.
Q: Will my photos be public?
A: Only visible to others at the event (via the event link). Not searchable online.
Q: Can I delete my photos?
A: Contact the event organizer - they can remove photos from the admin panel.
Q: Is it free for me?
A: Yes! Completely free for event attendees.
16.6 Support Resources
Documentation:

Getting Started Guide (organizers)
Guest Instructions (simple, 1-page)
API Documentation (developers)
White-Label Setup Guide (Enterprise)

Support Channels:

Email: support@eventsmoments.com
Live Chat (Pro+ during business hours)
Help Center (knowledge base)
Video Tutorials (YouTube)
Community Forum (coming soon)

SLAs:

Free: Email support (48-hour response)
Pro: Email support (24-hour response)
Premium: Priority email (12-hour response)
Enterprise: Dedicated support (4-hour response) + phone/Slack


Document Change Log
VersionDateAuthorChanges1.02026-01-09Product TeamInitial PRD draft - Complete specification

Approval & Sign-Off
Prepared By:
Product Team
Reviewed By:

 Engineering Lead
 Design Lead
 Marketing Lead
 CEO / Founder

Approved for Development:

 Yes, proceed with MVP
 No, requires revisions

Target MVP Launch Date: TBD based on resource allocation

END OF PRD

This comprehensive PRD covers all aspects of your Event Moments Capture & Lucky Draw platform, including the critical repackaging/white-label strategy for different events and clients. The document is ready to be used for:

Development: Engineering team can start building from these specs
Design: UI/UX team has clear guidelines
Sales: Enterprise sales has white-label details
Marketing: Clear positioning and target audiences
Fundraising: Investors can see complete vision and financials

Would you like me to:

Create a simplified 1-page executive summary?
Generate user stories for the development team?
Build a technical architecture diagram?
Create mockups/wireframes for key screens?