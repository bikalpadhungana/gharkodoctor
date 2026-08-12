# GharkoDoctor — Beta Launch Plan
**Status:** v0.1 — draft, follows systemdocument.md
**Assumption stated up front:** Phase 1 (booking, provider verification, payments, SMS) is built and working end-to-end. This plan assumes a *closed-then-open beta* in Kathmandu Valley before any wider rollout — narrow geography lets you catch problems (a bad match, a payment failure, a provider no-show) while the blast radius is small and you can personally intervene.

If you want to launch beta somewhere other than Kathmandu Valley first, or skip the closed stage, say so and I'll adjust — this is the one place worth confirming before locking the plan.

---

## 1. Beta goals — what you're actually testing

Not "does the app work" — you already know that. Beta exists to answer:

1. Will a stranger actually let a GharkoDoctor provider into their house, and will they pay for it?
2. Does the matching/dispatch actually produce an on-time visit, or does it fall apart in practice (provider unavailable, wrong address, no-show)?
3. Is the SMS + phone-in path actually used by people who wouldn't use the PWA?
4. Does the trust/verification layer catch bad providers before a bad visit happens, not after?
5. What's the real cost per completed booking (provider payout + your dispatch time + SMS cost)?

If you don't have hard answers to these before wider release, expanding geography just multiplies the same unknowns.

---

## 2. Scope for beta

**Geography:** 2–3 wards in Kathmandu Valley, ideally ones you can reach in person within 30 minutes if something goes wrong. Don't spread thin — density of both patients and providers in a small area is what makes dispatch actually testable.

**Provider pool:** Start with 5–10 verified providers, hand-picked (via a partner clinic or your own vetting), not open sign-up. You want people you can call directly and coach in week one.

**Service types:** Keep to the 3–4 highest-frequency ones from your Phase 1 list (e.g. general checkup visit, injection, IV, sample collection). Don't launch every service type at once — fewer moving parts, faster signal.

**User acquisition:** Closed beta first (invite-only — friends, family, a couple of local clinics referring patients), then open it to the ward once the closed group has produced ~20–30 completed bookings without a serious incident.

---

## 3. Beta readiness checklist

Before opening even the closed beta, confirm these are actually true — not "should work," but tested end-to-end with a real booking:

- [ ] A booking can be made, matched, confirmed, completed, and paid (all 3 payment paths: eSewa, Khalti, cash) without manual DB intervention
- [ ] SMS fires correctly at each state change (requested → confirmed → provider en route → completed)
- [ ] Provider verification status blocks an unverified provider from receiving bookings — tested, not assumed
- [ ] Admin/dispatch has a way to see all live bookings in one place and manually reassign if a provider cancels
- [ ] Phone-in booking path is live and someone (you, or whoever's on dispatch) is actually answering that number
- [ ] Panic/emergency contact path works and someone is on the other end of it
- [ ] Cancellation and refund flow exists (patient cancels, provider cancels, no-show) — this will happen in week one
- [ ] You have a way to manually message all beta providers at once (WhatsApp/Viber group is fine for this stage — don't over-build this)

If any box is unchecked, that's the actual work left before "beta," not the geography or marketing plan.

---

## 4. Timeline (suggested — compress or stretch based on your bandwidth)

| Week | Focus |
|---|---|
| 1 | Closed beta: 5–10 hand-picked providers, invite-only patients (your network + 1 partner clinic). Goal: 10–15 completed bookings. You personally monitor every booking. |
| 2 | Fix what broke in week 1 (there will be something — address accuracy, SMS delay, a provider not showing on time). Expand invite list slightly. Goal: 25–30 cumulative bookings, first real reviews collected. |
| 3 | Open beta to the 2–3 target wards — light local promotion (community WhatsApp/Viber groups, a partner clinic's waiting room, word of mouth). Stop hand-holding every booking; let dispatch run mostly on its own, you supervise. |
| 4 | Review the numbers against §5 metrics. Decide: expand wards, expand service types, or hold and fix. |

This is deliberately short — 4 weeks is enough to get a real signal without over-investing before you know the trust/dispatch loop actually holds up in practice.

---

## 5. Metrics that actually matter (not vanity numbers)

- **Completion rate:** bookings completed / bookings requested. If this is low, dispatch or provider availability is broken.
- **Time-to-match:** how long from request to a provider confirmed. This is the core promise of the product.
- **No-show rate** (provider side and patient side, separately).
- **Repeat booking rate:** did anyone book a second time? This is the real trust signal — one-time curiosity bookings tell you little.
- **Phone-in vs. PWA booking split:** tells you whether the "larger audience" reach strategy from the system doc is actually working, or whether beta users are all smartphone-first anyway.
- **Cost per completed booking**, all-in (provider payout, SMS, your time if you're valuing it).

Don't add more metrics than this at beta stage — a long dashboard is a distraction, not a decision tool.

---

## 6. Risk points specific to this stage

- **A bad visit (safety incident).** Have a plan for this before it happens, not after — who does the patient call, what do you do about the provider immediately, is there any insurance/liability exposure. This is the one risk that can kill the brand permanently; worth more prep time than anything else on this list.
- **Provider supply collapse.** With only 5–10 providers, one or two dropping out mid-beta is a real risk to completion rate. Keep 2–3 more vetted and ready as backup before week 1 starts.
- **Payment disputes.** Someone will dispute a charge or claim a no-show that wasn't. Decide the refund policy in advance, in writing, even if it's informal.
- **You becoming the bottleneck.** In week 1–2 this is fine (you should be hands-on), but if dispatch still requires you personally by week 4, that's a signal the system isn't ready to scale past beta, regardless of how good the numbers look.

---

## 7. Go / no-go criteria for moving past beta

Move to a full public launch only if, by end of week 4:
- Completion rate is consistently high (define your own bar, but treat anything under ~85% as not-ready)
- At least one clear case of repeat/referral usage (someone booked again or told someone else)
- No unresolved safety or payment-trust incident
- Dispatch can run without you personally approving every booking

If these aren't met, the right move is another 2–4 week beta cycle in the same narrow geography — not expanding wards to "find more signal." More geography rarely fixes an unresolved trust or dispatch problem; it just spreads it.

---

*Next natural document once beta starts: a `betalog.md` living log (same convention as developmentplan.md) tracking daily bookings, incidents, and fixes — worth starting on day one of week 1, not after.*