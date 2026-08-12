# GharkoDoctor — System Document
**Domain:** gharkodoctor.com
**Owner:** Bikalpa Dhungana / ESA Innovation
**Status:** Planning — v0.1
**Pattern:** Living log (update this file as decisions change, same convention as FlapMain's developmentplan.md)

---

## 1. Thesis

"Ghar ko Doctor" works because *doctor* in Nepali usage isn't strictly medical — it's shorthand for "the person who knows." Every neighborhood has one: the retired nurse two houses down, the electrician everyone calls first, the guy who fixes water pumps. The name already carries trust before the product exists. That's rare, and it's the thing to protect.

So the system is not "a telemedicine app." It's a **trust-verified, hyperlocal home-service booking platform**, launched narrow (home medical visits) and built so the same core can widen (diagnostics, elder care, and later — non-medical trusted home experts) without a rebuild.

This mirrors the decision you already made on FlapMain: don't hardcode "weight scale" into the backend, build a Schema Registry so new device types plug in. Here the same instinct applies to **service types** instead of device types.

---

## 2. Nepali-society constraints that shape the architecture

These aren't nice-to-haves — they determine what gets built first.

1. **Trust precedes convenience.** A stranger entering someone's house (especially for elderly parents, alone at home) is the actual product risk, not the booking UX. Verification (citizenship ID, license where applicable, community reference) has to be a first-class entity, not an afterthought field.
2. **Smartphone + app-store reach is not universal reach.** Meaningful population outside Kathmandu Valley books things by phone call, not app. If the goal is genuinely "largest audience," a call-in / SMS booking path is not optional polish — it's a parallel front door to the same backend.
3. **Bandwidth and device tier vary hard.** Design for 3G and budget Android first; the app-like smartphone UI is a bonus layer, not the baseline.
4. **eSewa/Khalti + cash-on-visit both need to exist.** Rural and older users will not pre-pay digitally for a home visit from someone they've never met.
5. **Language:** Nepali-first UI copy, English as secondary. Don't build this as an English product with a Nepali translation bolted on later.

---

## 3. Scope — phased

### Phase 1 (MVP): Home medical visits
- Book a nurse/paramedic/doctor for home visit: fever/checkup, injections, IV, wound dressing, elderly care check-ins, sample collection for lab tests.
- This is the validating wedge. Narrow, high-trust, high-frequency-enough-to-learn-from.

### Phase 2: Diagnostics network
- Partner with local labs; "book a blood test, sample collected at home, report delivered digitally + on call."
- Reuses the exact same booking/matching/payment engine.

### Phase 3: Service Registry expansion (the "doctor = knower" widening)
- Same platform, new service categories: electrician, plumber, appliance repair, tutor — using a **Service Type Registry** (see §5) so this doesn't require new backend logic per category, only new schema entries + category-specific verification rules.
- This phase is optional and market-tested, not committed at launch. Health-first keeps the brand meaning ("doctor") intact; widening too early dilutes trust.

---

## 4. High-level architecture

Same operating pattern as your current VPS stack (92.113.147.155) — MERN, PM2-managed, Nginx reverse proxy, Certbot SSL, MongoDB with per-app auth, GitHub Actions CI/CD. Next available port block: **5004** (frontend/API split as needed, matching NirmanLink=5000 / FlapCard=5001 / FlapMain=5003 convention).

```
┌─────────────────────────────────────────────────────────┐
│  Client layer                                            │
│  - Mobile-first React (PWA, not native app — no app      │
│    store gatekeeping, works from a browser bookmark)     │
│  - IVR/Call-center front door (phone booking → same API) │
│  - SMS confirmation (works on any phone, no data needed) │
└───────────────────────┬───────────────────────────────────┘
                         │
┌───────────────────────▼───────────────────────────────────┐
│  API layer (Node/Express)                                  │
│  - Auth (patients, providers, admin/dispatch)               │
│  - Booking state machine                                    │
│  - Matching engine (nearest verified provider, availability)│
│  - Service Type Registry (Phase 3 hook)                     │
│  - Notification dispatcher (SMS primary, push secondary)    │
│  - Payment adapter (eSewa / Khalti / cash-on-visit flag)     │
└───────────────────────┬───────────────────────────────────┘
                         │
┌───────────────────────▼───────────────────────────────────┐
│  Data layer — MongoDB (per-app credential, isolated DB)     │
│  Users, Providers, Bookings, Verifications, Payments,        │
│  ServiceTypes, Reviews                                       │
└───────────────────────────────────────────────────────────┘
```

**Why this stays low-compute:** no ML/inference, no video, no image processing on the critical path. The heaviest operation is nearest-provider geo matching, which is a cheap geospatial query (MongoDB `$near` on a ward/municipality-indexed field) — not a routing engine, not real-time tracking with constant GPS polling. Provider location can be ward-level granularity for matching, refined to exact address only after a booking is confirmed. This alone cuts a huge amount of unnecessary compute and battery/data drain on the provider's phone compared to Uber-style continuous GPS streaming.

---

## 5. Core data model (sketch)

```
User (patient/family)
 - name, phone, verified_phone (OTP), address, ward, municipality
 - preferred_language

Provider (nurse/paramedic/doctor, later: electrician/plumber/tutor)
 - name, phone, category (FK -> ServiceType)
 - verification_status: pending | verified | rejected
 - verification_docs: citizenship_id, license_number (nullable per category)
 - community_reference (optional, boosts trust score at launch when
   formal licensing is thin — important for non-medical categories later)
 - service_area: [wards]
 - availability_schedule
 - rating, completed_visits_count

ServiceType   ← the Registry pattern from FlapMain, applied here
 - name (e.g. "home_nurse_visit", "iv_injection", "blood_sample_collection")
 - required_verification_fields
 - base_price_range
 - category_group ("medical" | "diagnostic" | "home_repair" [Phase 3])

Booking
 - patient_id, provider_id, service_type_id
 - status: requested | confirmed | en_route | completed | cancelled
 - scheduled_time, address, ward
 - payment_method: esewa | khalti | cash
 - payment_status

Review
 - booking_id, rating, comment
```

The `ServiceType` table is the whole point of the Registry approach: launching "electrician" later is a new row + a small verification-rule config, not a new backend module. This is the same lesson FlapMain already taught you with device types — don't rebuild it here, just reuse the pattern.

---

## 6. Trust & verification layer (this is the actual product)

- Every provider goes through manual verification before their first booking: citizenship ID + (where applicable) professional license/certificate photo, reviewed by an admin — not automated, at this scale automation isn't worth the compute or the risk.
- Community reference field: at launch, formal nursing/paramedic licensing coverage outside urban centers is inconsistent. A "known and vouched for by X clinic / X ward office" field lets you onboard real, competent people who don't have paperwork yet, without pretending they're unverified.
- First N bookings for a new provider are visibly flagged "new provider" to patients — honesty beats hiding it.
- Emergency/panic contact button in the booking flow (call admin/dispatch directly) — necessary given this involves strangers entering homes.

---

## 7. Notification & access strategy (this is how you actually get "larger audience")

- **SMS is the primary channel**, not push notification. Booking confirmation, provider assigned, provider arriving — all SMS. Works on any phone, no data plan required.
- **Phone/IVR booking path**: a callable number where a dispatcher (or later, a simple IVR menu) takes the booking and enters it into the same system a PWA user would use. This is what actually extends reach past the smartphone-and-app-literate segment — arguably more important to "catch a larger audience" than any UI polish.
- PWA over native app: skips app store friction and updates instantly, works from a bookmark/shared link, far lower distribution cost.

---

## 8. Payments

- eSewa + Khalti integration (same partners you've already scoped for Vasawon — reuse that integration knowledge directly).
- Cash-on-visit as a first-class option, not a fallback bug. For elderly or first-time users, "pay the person when they arrive" is often the only payment method they'll trust initially.

---

## 9. What's explicitly out of scope at launch (to protect the low-compute goal)

- No AI symptom-checker / chatbot triage — this is a booking and dispatch system, not a diagnostic AI. Keeps compute near zero and avoids medical-liability complexity.
- No live GPS tracking map (ward-level ETA is enough at this stage; live tracking is expensive in data cost for the provider and unnecessary for trust — verification does that job instead).
- No native mobile app at launch.
- Non-medical service categories (Phase 3) stay off until the medical wedge has real usage data.

---

## 10. Open questions to resolve before build starts

1. Who does provider verification in Phase 1 — you, or a small partner clinic that already vets staff?
2. Ward-level coverage for launch: Kathmandu Valley only, or specific municipalities first?
3. Pricing model: flat visit fee + service cost, or commission on provider-set price?
4. Legal: does a home-nursing/paramedic dispatch service need a formal health-sector registration in Nepal before operating? (Needs actual research, not assumption.)

---

*Next step: once §10 is answered, this document should get a companion `developmentplan.md` with sprint breakdown, following the same living-log convention as antygravity.*# gharkodoctor
