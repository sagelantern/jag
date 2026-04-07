# Jag - Product Requirements Document

*Last updated: April 7, 2026. v0.1.0 shipped + v0.2.0 planned features.*

## Overview

Jag is a Chrome/Arc browser extension that intercepts distracting website visits with an AI-powered awareness intervention. At its core, it asks two questions: *why do you want to go here?* and *what's the underlying feeling or desire?* — then responds with a personalized, educational reflection that connects your answer to your patterns, goals, and what the research says about how cravings actually work.

Jag is not the cure for attention problems. It's the cast on the bone while it heals. The healing is meditation, retreats, sitting with discomfort, processing what you're avoiding. Jag protects the space while that deeper work compounds.

**Buddhist naming convention** (like Nivas): "Jag" = awareness/awakening.

## Problem Statement

The surface problem is "I use distracting sites too much." The actual problem: **the capacity to sustain attention on one thing has degraded.** The craving for stimulation fires not just when bored, but mid-task, mid-conversation, mid-article. It's not filling a void. It's interrupting something already happening because the brain's threshold for sustained focus has been compressed by years of high-frequency context-switching.

### What the user has tried (and why each failed)

| Experiment | Layer Targeted | Outcome |
|---|---|---|
| Dumb phone / no phone | Cue (Make it Invisible) | Craving migrated to laptop |
| Physical locked box | Response (Make it Difficult) | Found workarounds, unsustainable |
| Wife holds phone password | Response (Make it Difficult) | Social friction, didn't address craving |
| Brick / One Sec / Freedom.to | Response (Make it Difficult) | Habituated within days-weeks |
| Deleting social media apps | Cue (Make it Invisible) | Opened random apps instead — craving found new outlets |
| AI agent surfaces content | Cue (Make it Invisible) | Only works if everything else is blocked; laptop defeats it |
| Long password | Response (Make it Difficult) | Habituated, became mindless |

**The pattern:** Every experiment targets the Cue or Response layer. Every one fails because the craving reroutes. The Craving and Reward layers have never been addressed.

### Research foundation

The most replicated findings in addiction and behavioral change research:

1. **Motivational Interviewing (Miller & Rollnick, 200+ RCTs):** People change when they hear *themselves* articulate why. The act of writing your feelings recruits conscious processing that tapping a button does not.

2. **MBRP / Urge Surfing (Bowen, Witkiewitz & Marlatt, 2014):** Observing cravings without acting weakens the craving-behavior link over time. Cravings still arise. They just stop leading to action.

3. **Allen Carr (Frings et al., 2020 RCT):** 2x quit rate vs standard cessation. Once you genuinely see the reward as an illusion, there's nothing to resist. The mid-session check-in delivers this insight experientially.

4. **Contingency Management (9+ meta-analyses):** Escalating rewards for sustained abstinence produce the largest effect sizes of any psychosocial addiction intervention. Jag's streak system borrows this.

5. **Stages of Change (Prochaska & DiClemente, 1992):** Most interventions fail because they target Action while the person is in Contemplation. Jag meets people where they are.

6. **The combination principle:** The most effective treatments combine restriction (break the acute cycle) with awareness (maintain the change). Neither alone is sufficient.

7. **Project MATCH (1997):** The largest alcohol treatment study ($27M, 1,726 patients) found all three treatments (CBT, motivational, 12-step) produced identical outcomes. The technique matters less than common factors: self-efficacy, readiness to change, therapeutic alliance.

8. **Robins' Vietnam Study (1974):** 95% of heroin-addicted soldiers quit when they returned home, most without treatment. Environment is the primary driver — but only works when you can fully change it. You can't remove your laptop.

## Design Philosophy

### The Compassion-Strictness Slider

Jag operates on a configurable spectrum from fully compassionate (0%) to fully strict (100%). **Default: 50%.**

The slider controls two things simultaneously:

**Tone:** How the AI responds to you.
- 0% (compassionate): Warm, reflective, non-judgmental. "The restlessness is real. Is Reddit actually going to help with that?"
- 50% (balanced): Honest and direct with a point of view. Challenges the remedy, not the person. "You said the same thing yesterday and told me it wasn't worth it. What's different now?"
- 100% (strict): Prosecutorial. Calls out BS. "That's the third time this week you've said 'just checking.' You're not checking. You're avoiding."

**Gate behavior:** Whether the AI can deny access.
- 0% (compassionate): Always allow. You've been seen, challenged, offered an alternative — but the choice is always yours.
- 50% (balanced): Allow most of the time. Pushback on weak reasons. Deny only in clear cases (visit #4+ with no real reason, presence time with no emergency).
- 100% (strict): Strict gatekeeper. Default is deny. Must make a specific, time-sensitive case. Escalating strictness by visit count.

The slider also modulates:
- Timer lengths (0% = no timers, 100% = aggressive escalating timers)
- Pushback persistence (0% = one gentle question, 100% = two rounds, then deny)
- Late-night behavior (all settings get stricter after configured evening hours)

### James Clear's 4 Laws (inverted)

- **Law 1: Make it Invisible (Cue)** — Out of scope. Table stakes handled separately.
- **Law 2: Make it Unattractive (Craving)** — **Primary layer.** The awareness prompt + educational AI response. Makes you confront what you're feeling and why the chosen remedy doesn't actually address it.
- **Law 3: Make it Difficult (Response)** — **Secondary layer.** Scales with the strictness slider: from zero friction (compassionate) to escalating timers (strict).
- **Law 4: Make it Unsatisfying (Reward)** — **New in v0.2.** Mid-session check-in makes the hollow reward experientially visible. Pattern data over time makes it undeniable.

## Target User

People who:
- Have tried multiple screen time solutions and habituated out of all of them
- Cannot fully block devices due to legitimate work/life needs
- Recognize their behavior as addictive, not just a bad habit
- Have the self-awareness to set up constraints during rational moments
- Are interested in *understanding* their patterns, not just suppressing them

## Core User Flow

### Step 1 — Intercept + Awareness Line

User navigates to a flagged site. Early blocker fires at `document_start` (no content flash). Loading screen while AI generates the awareness line.

Overlay renders with:
- Header: "jag" logo + streak status + visit count
- AI-generated awareness line (contextual, personal, unique each time, max 15 words)
- Prompt: **"Why do you want to open this? What's the underlying feeling or desire?"**
- Free text input (must write a real response)
- "I don't need this" exit button

The prompt asks for both the reason AND the feeling. Not one or the other.

### Step 2 — AI Response (educational, compassionate-to-strict)

The AI evaluates the response for genuine engagement (catches low-effort BS like "idk" or "bored" with a redirect: "That doesn't sound like what's actually going on — try again honestly").

Then responds with a message that is:
- **Educational:** Connects what the user wrote to relevant research, patterns, or behavioral science. Not a lecture — a brief, specific insight. "Restlessness after 45 minutes of focused work is normal — your brain's novelty-seeking circuitry is firing. Reddit won't scratch the itch, it'll deepen it."
- **Reflective:** Mirrors the user's own pattern history. "You've named restlessness 4 of the last 5 times at this site. Every time you proceeded, you rated it 2/5 afterward."
- **Challenging (scaled by slider):** At compassionate end, gently questions the remedy. At strict end, directly calls out the pattern. At 50%, has an honest point of view without being adversarial.

### Step 3 — Alternative Suggestion (NEW in v0.2)

Based on the feeling named and the user's configured preferences, Jag surfaces 1-2 alternatives that:
- Have **lower activation energy than the distraction** (loaded in the overlay, one click)
- Match the **actual underlying need** (not generic suggestions)
- Were **chosen by the user's rational self** during onboarding

User can: take the alternative (one click) → proceed to site → or close tab.

### Step 4 — Gate Decision (scaled by slider)

At the compassionate end: "Continue to Reddit?" button always available after Step 2.
At 50%: available most of the time, pushback on weak responses, rare denials.
At the strict end: allow/pushback/deny verdicts as in v0.1.

If a timer applies (slider > 0%), countdown before site loads.

### Step 5 — Mid-Session Check-In (NEW in v0.2)

**2 minutes after the user proceeds to the site**, a gentle overlay appears:

> "You said you were restless and needed a break. Is this helping?"
> [Yes, I'm getting value] [Not really] [Close site]

Or: "You've been here 2 minutes. Still getting what you came for?"

This is the Allen Carr moment delivered experientially. You don't need to be told scrolling is empty. You just need to be asked to notice while you're doing it.

Response is logged. Over time builds a satisfaction dataset: how often does proceeding to the site actually deliver what the user said they wanted?

**Follow-up check-ins:** If user selects "Yes" at 2 minutes, check in again at 10 minutes, then 20. Each check-in is a moment of conscious choice rather than autopilot continuation.

### Step 6 (background) — Pattern Accumulation

All data accumulates into a personal insight map:
- **Craving triggers:** What feelings drive you to which sites, at what times
- **Satisfaction scores:** Distraction rated 2/5 vs alternative rated 4/5 — across dozens of instances
- **Trend lines:** Frequency decreasing? Cravings weakening? Gap between urge and action widening?
- **Your own words:** Verbatim from check-ins. "Not worth it." "Wasted 30 minutes." "Glad I walked instead."

Surfaced in the AI's educational responses ("the last 8 times you were restless...") and available in a weekly summary / options page dashboard.

## Alternative Suggestions System

### Design Constraint
The alternative must have **lower activation energy than the distraction.** If Reddit is one click, the alternative must be zero clicks — already loaded in the overlay.

### The Two Alternatives

The alternative system is deliberately simple: two options, both zero-click, both in-overlay, both with natural endpoints.

#### 1. One Interesting Thing

A single curated article, pre-fetched and rendered right in the overlay. 2-3 minute read. You read it there, not on another site. No feed, no rabbit hole. When you're done, the overlay says "That's it. Back to what you were doing?"

**Content pipeline:**
- Daily batch job fetches the top/latest item from 5-10 configured RSS feeds
- Extracts article text, caches locally in Chrome storage
- The overlay picks one at random from today's batch
- If all have been seen, pulls from the previous day's batch

**Configured feeds (Yash):**
- Dharma: Access to Insight, Tricycle daily, Lion's Roar
- Investment/startups: Stratechery, Lenny's Newsletter, First Round Review
- Behavioral science: BPS Research Digest, Psyche (Aeon), Barking Up the Wrong Tree
- Arsenal: r/Gunners top post (daily, rendered as text summary)
- Travel/hotels: Condé Nast Traveler, Nivas-relevant feeds TBD

**Technical:** RSS fetch via background service worker on a timer (every 6 hours). Article text extracted and stored locally. Overlay renders the cached text directly — no iframe, no external load, instant display.

#### 2. Lichess Puzzle

A single chess tactic, embedded in the overlay via the Lichess puzzle API. 10-30 seconds. Find the best move (usually 2-3 moves deep). Clear endpoint: solved or failed.

**Technical:** Lichess has a free, no-auth API (`GET /api/puzzle/daily` or `/api/puzzle/next`). Returns FEN position + solution moves. Render a board in the overlay using chessboard.js or a lightweight canvas renderer. User taps/clicks pieces to make moves. Instant feedback on correct/incorrect.

**Why these two work:**
- Both are zero-click (already loaded when the overlay appears)
- Both have hard natural endpoints (one article, one puzzle)
- Both are genuinely appealing — not brussels sprouts
- Both leave you feeling better after than Reddit does
- Both are 30 seconds to 3 minutes — matches the craving window
- One is stimulating (puzzle), one is absorbing (reading) — covers different flavors of "I need something"

### Onboarding Configuration

During setup:
- Add RSS feed URLs for One Interesting Thing pipeline
- Configure Lichess difficulty preference (easy/medium/hard)
- AI tracks which alternative is taken vs dismissed and adapts suggestion order over time

## Compassion-Strictness Slider: Technical Detail

Stored as `config.compassionLevel` (0-100, default 50).

### How it modulates behavior

| Setting | Tone | Gate | Timers | Pushback | Late night |
|---|---|---|---|---|---|
| 0 (full compassion) | Warm, reflective | Always allow | None | One gentle question | Same as day |
| 25 | Supportive with opinion | Allow, rare pushback | Minimal (5-10s) | One direct question | Slightly stricter |
| 50 (default) | Honest, direct, has a point of view | Allow most, pushback on weak, rare deny | Moderate | One direct question, deny on BS round 2 | Noticeably stricter |
| 75 | Confrontational when warranted | Pushback default, deny frequently | Aggressive | Two rounds, then deny | Very strict |
| 100 (full strict) | Prosecutorial | Deny default, must justify | Maximum escalation | Two rounds, hard deny | Near-block |

The slider is surfaced in the options page. Can be changed anytime. Late-night behavior always shifts 1-2 notches stricter regardless of setting.

## AI Awareness Line (unchanged from v0.1)

Generated by OpenClaw via the OpenResponses API (Claude Sonnet).

**Properties:**
- Max 15 words, different every time
- References the user's actual life (calendar, rituals, family, work)
- Both (a) something real from the user's life right now AND (b) what this specific site gives vs costs
- Site-specific framing (Reddit = dopamine scroll; Email = compulsive refresh; YouTube = algorithm rabbit hole)

## Educational Layer

The AI response in Step 2 is not just a mirror — it's **educational**. It connects the user's behavior to what the research says:

- "Cravings peak and pass in 90 seconds whether you act on them or not. That's urge surfing — Marlatt's research."
- "You're doing what the research calls 'craving migration' — you blocked Reddit so the craving found Slack. It's the same impulse."
- "Allen Carr's insight about smoking applies here: the scroll doesn't relieve the restlessness, it created the restlessness. Check how you feel in 10 minutes."
- "Your brain's dopamine system downregulates with overstimulation. Every session makes the next craving stronger. Volkow's PET imaging studies show this clearly."

Educational content is woven into the personal reflection, not delivered as a lecture. Brief, specific, connected to what the user just wrote. The goal: over weeks, the user internalizes the behavioral science and starts recognizing the patterns without Jag's help.

## Email-Specific Intelligence (unchanged from v0.1)

For email sites, the gatekeeper checks the user's actual inbox via OpenClaw:
- Important unread emails from real people: mentions them, more lenient
- Nothing new: says so, stricter ("you're compulsively refreshing")
- Tracks last email access time

## Streak System (unchanged from v0.1)

- Daily target: configurable minutes on flagged sites (default: 30 min)
- Each day under target continues the streak; exceeding resets to 0
- Current + longest streak displayed on every overlay
- Active time tracking via background service worker

## Idle Re-trigger (unchanged from v0.1)

After 60 seconds of inactivity on a flagged site, the overlay re-appears.

## Site Configuration (unchanged from v0.1)

80+ preconfigured sites across 8 categories. Custom sites addable. Each site: pattern, category (`never_work` / `sometimes_work`), enabled, group.

## Technical Architecture

### Extension Components
- **Manifest V3** Chrome extension
- **Content Script** (`content.js`): `document_start` early blocker, overlay UI (chat + alternatives + mid-session check-in), focus guards
- **Background Service Worker** (`background.js`): State management, OpenClaw API calls, alternative selection, mid-session timer scheduling, pattern tracking
- **Overlay CSS** (`overlay.css`): Dark theme (#1a1a2e), purple accent (#c8b6ff), writing-focused input, embedded breathing/audio player for alternatives
- **Options Page** (`options.html` + `options.js`): Site toggles, schedule, compassion slider, alternative preferences, onboarding flow, pattern dashboard

### OpenClaw Integration
- **Endpoint:** OpenResponses API (`POST /v1/responses`)
- **Model:** Claude Sonnet (via `x-openclaw-model` header)
- **API calls per interception:**
  1. Awareness line generation (on navigation)
  2. Response evaluation + educational reply (on user submission; may include BS redirect)
  3. Mid-session check-in context (optional, can be local)
- **Auth:** Bearer token (gateway shared secret)
- **Fallback:** Local templates when API unreachable; mid-session check-ins work fully offline
- **Timeout:** 20 seconds per call

### Data Model (Chrome Local Storage)
- `sites[]`: pattern, category, enabled, group
- `sessions[]`: site, timestamp, writtenResponse, feelingCategory (inferred), aiResponse, userChoice (proceed/alternative/close), alternativeTaken, timerServed
- `checkins[]`: timestamp, site, sessionId, wasWorthIt (yes/no/closed), durationMinutes
- `alternatives`: configured sources, suggestion history, acceptance rates
- `patterns`: aggregated by feeling, site, time-of-day, satisfaction scores
- `streaks`: current, longest, dailyMinutes, lastDate, targetMinutes
- `excuseHistory[]`: site, reason, timestamp, verdict (last 50)
- `config`: workHours, presenceTimes, rollingWindowMinutes, dailyTargetMinutes, compassionLevel (0-100), apiEndpoint, apiBearerToken, timerBase
- `onboarding`: readingListUrl, preferencesByFeeling, customAlternatives
- `lastEmailAccess`: timestamp

### Privacy
- All data stored locally
- No external servers (OpenClaw on localhost / Tailnet only)
- No telemetry, no analytics
- Usage data never leaves the machine

## Known Bugs (v0.1)

1. **Superhuman input focus** — SPA steals focus. Mitigated with retry + focus guard.
2. **Intermittent loading screen** — persists when API response arrives.
3. **Reddit content flash** — brief flash before early blocker on some navigations.

## What's New in v0.2 (to build)

1. **Compassion-strictness slider** — configurable 0-100, modulates tone + gate + timers
2. **Combined prompt** — "Why do you want to open this? What's the underlying feeling or desire?"
3. **Educational AI responses** — connects behavior to research, patterns, behavioral science
4. **Mid-session check-in** — 2 min after proceeding, then 10 min, then 20 min. "Is this helping?"
5. **Alternative suggestions** — one-click, lower-friction-than-distraction, personalized by feeling state
6. **Onboarding flow** — reading list connection, alternative preferences by feeling
7. **Pattern dashboard** — craving map, satisfaction comparison, trend lines, weekly summary
8. **BS detection refinement** — redirect low-effort responses without denying; ask for honesty, not justification

## Open Questions

1. **Can alternatives truly compete with Reddit's activation energy?** Article-in-overlay promising but untested. If alternatives require even one extra decision, they lose.
2. **Mid-session check-in timing:** 2 min proposed. Configurable? Too aggressive? Too passive?
3. **Reading list integration complexity.** Pocket/Instapaper APIs add build time. MVP: manual URLs.
4. **Camera roll from Chrome extension** — may not be feasible. Skip for MVP.
5. **Cross-device:** Chrome extension = laptop only. Phone is the bigger battlefield.
6. **Weekly summary delivery format.** In-extension dashboard? Email? Notification?
7. **Should compassion slider shift automatically?** E.g., stricter after repeated "not worth it" check-in responses, more compassionate during a long streak.
8. **Pattern dashboard scope for MVP.** Full dashboard or just enhanced AI responses that reference patterns?

## Success Metrics

**Week 1 (v0.2 personal use):**
- Are written responses genuinely reflective or gaming?
- How often does the user take an alternative vs proceed?
- Mid-session check-in: what % say "not worth it"?
- Does the educational tone land? Does it feel different from v0.1?
- Is the 50% slider the right default?

**Week 2-4:**
- Awareness development: fewer proceeds, more alternatives, shorter sessions
- Craving frequency: fewer total intercepts per day
- Alternative match quality: acceptance rate increasing
- Mid-session impact: users closing sites after check-in
- Anti-habituation: user still engaging with AI responses

**Month 2+:**
- Can the user articulate their trigger map without the dashboard?
- Allen Carr internalization: declining proceed rate, increasing "not worth it" at check-ins
- Satisfaction gap: clear separation between distraction and alternative ratings
- **The ultimate metric: does the user need Jag less over time?**
