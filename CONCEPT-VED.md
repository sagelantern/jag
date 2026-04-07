# Ved — Concept Document

*April 7, 2026. Pre-build exploration.*

## What Ved Is

Ved is a Chrome/Arc browser extension that intercepts distracting website visits and turns each one into a micro-awareness practice. Instead of blocking you or judging your reasons, it asks you to notice what you're actually feeling, reflects your patterns back with honesty and compassion, offers an alternative that's easier than the distraction, and then lets you choose. If you proceed, it checks in a few minutes later to ask: was it worth it?

The name comes from Vedana (Pali) — the feeling tone that arises at the moment of contact between sense and object. In Buddhist psychology, vedana is the exact point where craving is born. Ved intervenes there.

## What Ved Is Not

- Not a blocker. You can always proceed.
- Not a judge. No deny verdicts, no "your reason isn't good enough."
- Not a productivity tool. It doesn't care if you're efficient. It cares if you're aware.
- Not the cure. It's the cast on the bone while the bone heals. The healing is meditation, retreats, sitting with discomfort, processing what you're avoiding. Ved protects the space while that work compounds.

## The Problem (Honest Version)

The surface problem is "I use distracting sites too much." The actual problem, uncovered through customer discovery and personal experimentation:

**The capacity to sustain attention on one thing has degraded.** The craving for stimulation fires not just when bored, but mid-task, mid-conversation, mid-article. It's not filling a void. It's interrupting something already happening because the brain's threshold for sustained focus has been compressed by years of high-frequency context-switching.

Every existing solution targets the wrong layer:

| What's been tried | Why it fails |
|---|---|
| App blockers (Freedom, Brick) | Craving reroutes to another app/device |
| Physical locks (backpack lock, wife holds password) | Unsustainable, creates social friction |
| App deletion | Brain opens random apps (Whoop, Lululemon) for zero-value stimulation |
| Friction tools (One Sec, long passwords) | Habituates in days. The pause becomes muscle memory. |
| AI gatekeeper (Jag v1) | Adversarial. Feels like a parent. User fights it or resents it. |

The pattern: every experiment targets the Cue (make it invisible) or Response (make it difficult) layer. The Craving and Reward layers have never been addressed. The craving always finds a new route because the craving itself is untouched.

## Research Foundation

Ved's design is informed by the most replicated findings in addiction and behavioral change research:

1. **Motivational Interviewing (Miller & Rollnick, 200+ RCTs):** People change when they hear *themselves* articulate why. Not when someone tells them to. The act of putting your feelings into words recruits awareness that selection from a menu does not.

2. **MBRP / Urge Surfing (Bowen, Witkiewitz & Marlatt, 2014 RCT):** Mindfulness-based relapse prevention outperformed both standard treatment and CBT at 12 months. The mechanism: observing cravings without acting weakens the craving-behavior link over time. Cravings still arise. They just stop leading to action.

3. **Allen Carr (Frings et al., 2020 RCT):** 2x quit rate vs standard cessation. The mechanism: cognitive reframing. Once you genuinely see the reward as an illusion, there's nothing to resist. The mid-session check-in is designed to deliver this insight experientially, not intellectually.

4. **Contingency Management (Higgins et al., 9+ meta-analyses):** Escalating rewards for sustained abstinence produce larger effect sizes than any other psychosocial intervention. The streak system borrows this principle.

5. **Stages of Change (Prochaska & DiClemente, 1992):** Most interventions fail because they target the Action stage while the person is in Contemplation. Ved meets people where they are — it doesn't demand action, it builds awareness that eventually makes action feel obvious.

6. **The combination principle:** The most effective treatments in the literature combine restriction (break the acute cycle) with awareness (maintain the change). Neither alone is sufficient. Ved provides enough friction to interrupt autopilot while building the awareness muscle that produces durable change.

## Design Philosophy

**Core principle:** The friction is not in getting through. The friction is in staying unconscious.

- **Vipassana at the point of autopilot.** Notice the craving. Name it. See it clearly. Then choose.
- **Compassionate but honest.** A good friend who knows everything about you and won't let you bullshit yourself. Not a judge, not a blank mirror. Has a point of view.
- **Enforced accountability around awareness.** You can't skip the noticing. But the noticing doesn't block you. Once you've genuinely engaged, you're free to choose.
- **Alternatives, not restrictions.** Don't just say "don't do the thing." Offer something better that's easier to do right now.
- **Your own data, your own words, your own proof.** Over time, Ved builds a dataset from your responses and check-ins that makes the patterns undeniable. You can lie to the gate. You can't lie to weeks of your own evidence.

## Core User Flow

### Step 1 — Name It (required, free text)

User navigates to a flagged site. Full-screen overlay appears.

> "What's pulling you here right now?"

Free text input. Must write at least a sentence. No dropdown menu, no one-tap options. The act of composing is the intervention — it recruits conscious processing that a tap does not.

**Anti-BS mechanism:** AI evaluates whether the response is genuine engagement, not whether the reason is "good enough." Low-effort/dismissive responses ("asdf", "idk", "bored") get a gentle redirect: "That doesn't sound like what's actually going on. What is?" Not punitive. Just: try again, honestly.

### Step 2 — Compassionate Challenge (AI-generated)

The AI reflects back:
- What you just said
- Your pattern (how often you've named this feeling, for this site, at this time)
- Connection to your stated goals/intentions
- A direct but warm challenge to the *chosen remedy* (not the feeling)

**Example:**

User writes: "I'm restless, need a break from this planning session"

Ved responds: "You said the same thing yesterday at 3pm and spent 40 minutes on Reddit. You told me afterward it wasn't worth it. The restlessness is real — but is Reddit actually rest for you?"

**Tone:** Compassionate but with a point of view. Not a dashboard showing stats. Not a therapist nodding. A friend who's been through it and cares enough to say the honest thing.

### Step 3 — Offer an Alternative (one-click, instant)

Based on the feeling named and the user's pre-configured preferences, Ved surfaces 1-2 alternatives that:
- Have **lower activation energy than the distraction** (already loaded in the overlay, one click)
- Match the **actual underlying need** (not generic "go meditate" suggestions)
- Were **chosen by the user's rational self** during onboarding

The user can take the alternative (one click) or proceed to the site.

### Step 4 — Your Call

"Continue to Reddit?" — one button. No timer. No escalation. You've been seen. You've named it. You've been offered something better. Now you decide, fully conscious.

### Step 5 — Mid-Session Check-In (5 minutes after proceeding)

A gentle overlay appears:

> "You said you needed a break. Did this help?"

Or: "You've been here 5 minutes. Still getting what you came for?"

Simple response: Yes / No / Close site.

This is the Allen Carr moment delivered experientially. You don't need to be told scrolling is empty. You just need to be asked to notice while you're doing it.

Over time, this builds a comparison dataset: distraction vs alternative. "The last 8 times you were restless, you scrolled 5 times (avg satisfaction: 2/5) and walked 3 times (avg satisfaction: 4/5)." Your own evidence, making the reward illusion undeniable.

## Alternative Suggestions System

### Design Constraint
The alternative must have **lower activation energy than the distraction.** If Reddit is one click, the alternative must be zero clicks — already loaded in the overlay.

### By Feeling State

**Restless / need stimulation:**
- A curated article from user's reading list (Pocket, Instapaper, Substack saves). One click, opens immediately.
- A writing prompt from a pre-loaded question bank. Tiny writing space right in the overlay. Novel, generative, has a natural endpoint.
- A quick puzzle (chess puzzle, Wordle). Stimulating with a natural stopping point.

**Bored / need novelty:**
- An unread message from a real person. "Jay texted 3 hours ago. Reply?" One click opens the conversation. The brain often wants connection — Reddit is a simulacrum. An actual message is the real thing.
- A random photo from the user's camera roll. Tiny moment of delight, zero harm.
- A bookmarked article the user saved but never read. Serves their own backlog.

**Avoiding something:**
- Opens the actual document/tab the user should be working on. "Your Ved concept doc is in tab 3. Switch?" One click.
- A 5-minute countdown timer with the task named, right in the overlay. Pomodoro entry ramp.

**Tired / low energy:**
- A 2-minute guided breathing exercise, plays right in the overlay. No app switch.
- "Close the laptop for 10 minutes. I'll be here when you get back." With a countdown.

**Anxious / unsettled:**
- A freewrite text box. "Write what's on your mind. Nobody sees this." 90 seconds, then it disappears.
- A 60-second body scan audio in the overlay.

### Onboarding (Configuring Alternatives)

During setup, user connects:
- Reading list (Pocket API, Instapaper API, or manual RSS feeds/Substacks)
- Camera roll access (optional)
- Current projects/tabs they want surfaced as "switch to" options
- Personal preferences: "When you're restless, what actually helps?" "When you're avoiding, what gets you unstuck?"

AI tracks which alternatives the user takes vs dismisses and adapts over time. Stops suggesting things that never land. Learns "walks work at 2pm but not 9am."

## Pattern Visibility (The Long Game)

Ved accumulates a personal dataset over weeks:

- **Craving map:** What feelings drive you to which sites, at what times
- **Satisfaction comparison:** Distraction rated 2/5, alternative rated 4/5 — across dozens of instances
- **Trend lines:** Is the frequency decreasing? Are the cravings weakening? Is the gap between urge and action widening?
- **Your own words:** Verbatim quotes from your check-ins. "Not worth it." "Wasted 30 minutes." "Actually glad I walked instead."

This data isn't for shame. It's for insight. The goal is to make the Allen Carr realization *emerge from your own evidence* rather than from a lecture.

Surfaced in a weekly summary (optional) or available in the options page dashboard.

## Streak System

Borrowed from contingency management research (largest effect sizes in addiction treatment):

- Daily target: configurable minutes on flagged sites
- Streak continues each day under target
- Streak resets on exceeding target
- Displayed on every overlay — visible but not central
- The escalating value of the streak (day 14 > day 1) creates loss aversion that grows with success

## Tone and Voice

Ved speaks like a wise friend, not a therapist, not a bouncer, not a dashboard.

- **Compassionate:** acknowledges the feeling is real
- **Honest:** doesn't let you bullshit yourself
- **Has a point of view:** challenges the remedy, not the person
- **Non-judgmental about the craving:** the craving isn't bad. The autopilot is.
- **Warm but direct:** "The restlessness is real. Reddit won't fix it and you know that."
- **Uses your own words and data:** "You said 'not worth it' the last 3 times."

## How Ved Differs from Jag

| | Jag | Ved |
|---|---|---|
| **Philosophy** | Bouncer | Meditation teacher |
| **Gate model** | Justify yourself → AI judges → allow/deny | Name what you feel → AI reflects → you decide |
| **Tone** | Prosecutorial, escalating strictness | Compassionate, honest, has a point of view |
| **On proceed** | Enforced timer | No timer. You chose consciously. |
| **Post-access** | Nothing | Mid-session check-in ("was it worth it?") |
| **Alternatives** | None | Personalized, one-click, lower-friction than the distraction |
| **Data use** | Excuse history to catch lies | Pattern visibility to build self-knowledge |
| **Goal** | Reduce screen time | Build awareness muscle |
| **Metaphor** | Antabuse | MBRP / vipassana |

## Technical Architecture (Chrome Extension)

### Components
- **Content Script:** Runs at `document_start`. Early blocker prevents content flash. Renders the naming overlay, compassionate challenge, alternative suggestions, and mid-session check-in.
- **Background Service Worker:** State management, OpenClaw API calls (for compassionate challenge and BS detection), alternative selection logic, pattern tracking, mid-session timer.
- **Overlay UI:** Warm, non-aggressive design. Writing-focused (large text input, not buttons). Breathing/audio player embedded for calm alternatives.
- **Options Page:** Onboarding flow, reading list connections, alternative preferences, pattern dashboard, weekly summary.

### OpenClaw Integration
- **Compassionate challenge generation:** One API call per intercept. Sends: user's written response, pattern history, time/calendar context, streak data. Returns: personalized reflection + challenge.
- **BS detection:** Evaluates whether the written response is genuine engagement. Returns: genuine / redirect (with follow-up prompt).
- **Mid-session check-in:** May be local (simple prompt) or API-enhanced (contextual based on what user wrote at the gate).
- **Model:** Claude Sonnet via OpenResponses API (same as Jag).
- **Fallback:** If API unreachable, use locally stored pattern data for a simpler reflection. Mid-session check-ins work fully offline.

### Data Model (Chrome Local Storage)
- `entries[]`: { timestamp, site, writtenFeeling, feelingCategory (inferred), aiChallenge, userChoice (proceed/alternative/close), alternativeTaken }
- `checkins[]`: { timestamp, site, entryId, wasWorthIt (yes/no/closed), durationMinutes }
- `alternatives`: { configured sources (RSS, Pocket, etc.), suggestion history, acceptance rates }
- `patterns`: { aggregated by feeling, site, time-of-day, satisfaction scores }
- `streaks`: { current, longest, dailyMinutes, targetMinutes }
- `onboarding`: { readingListUrl, preferences by feeling state, custom alternatives }

### Privacy
- All data stored locally
- No external servers (OpenClaw on localhost/Tailnet only)
- No telemetry
- Written feelings never leave the machine (except to local OpenClaw for AI processing)

## Open Questions

1. **How long before the compassionate challenge habituates?** The AI makes it different every time, but will users start glazing past it like they glaze past One Sec? The mid-session check-in may be the more durable intervention.
2. **Reading list integration complexity.** Pocket/Instapaper APIs add build time. MVP could start with manual RSS feeds or a simple bookmarks list.
3. **Camera roll access from a Chrome extension.** May not be technically feasible. Could use a linked photo folder or skip for MVP.
4. **Mid-session check-in timing.** 5 minutes proposed. Should it be configurable? Should it escalate (check in again at 15 min, 30 min)?
5. **Can the alternatives truly compete with Reddit's activation energy?** The article-in-overlay idea is promising but needs testing. If the alternative requires *any* more effort than the distraction, it loses.
6. **Cross-device problem persists.** Chrome extension = laptop only. Phone is the bigger battlefield. Same limitation as Jag.
7. **Should Ved and Jag coexist?** Different modes for different contexts? Jag for late-night (when awareness is low, restriction is appropriate) and Ved for daytime (when awareness capacity is higher)?
8. **Weekly summary format.** Email? In-extension dashboard? Notification? What's the right delivery for pattern insights without creating another thing to check?

## Success Metrics

**Week 1:**
- Are written responses genuinely reflective or gaming?
- How often does the user take the alternative vs proceed?
- Mid-session check-in: what % say "not worth it"?
- Subjective: does the compassionate challenge *land*? Does it feel different from Jag?

**Week 2-4:**
- Is the awareness muscle visibly developing? (Fewer proceeds, more alternatives taken, shorter sessions when proceeding)
- Are cravings weakening? (Fewer total intercepts per day)
- Are the alternatives well-matched? (Acceptance rate increasing)
- Is the mid-session check-in changing behavior? (Users closing sites after check-in)
- Anti-habituation: is the user still reading the AI challenge, or glazing?

**Month 2+:**
- Pattern data: can the user articulate their own trigger map without looking at the dashboard?
- Allen Carr moment: has the user internalized that the distraction doesn't deliver? (Evidenced by declining proceed rate and increasing "not worth it" responses)
- Satisfaction comparison: clear separation between distraction satisfaction and alternative satisfaction in the data?
- The ultimate metric: does the user need Ved less over time? A successful awareness tool makes itself obsolete.
