# GharkoDoctor — Beta Log (`betalog.md`)

**Target Region:** Kathmandu Valley (Initial Wards)  
**Status:** Beta Preparation & Launch Phase  

---

## 1. Beta Readiness Audit Matrix

| Requirement / Goal | System Component | Status | Notes |
|---|---|---|---|
| End-to-end booking flow | Patient → Provider → Admin | ✅ READY | Fully functional across PWA and API |
| Cash-on-Visit payment | Payment Adapter | ✅ READY | First-class option for trust building |
| eSewa & Khalti options | Payment Adapter | ✅ READY | Digital wallet stubs & redirect hooks active |
| SMS State Change Alerts | SMS Dispatcher | ✅ READY | Triggers on booking request, assignment, en-route & completion |
| Provider Verification Gate | Admin Verification | ✅ READY | Unverified providers blocked from receiving bookings |
| Dispatch Control Center | Admin Dashboard | ✅ READY | Live booking view & manual provider assignment |
| Phone-in Call Center Frontdoor | Dispatch Phone Booking | ✅ READY | Admins can register phone callers instantly |
| Emergency Panic Button | Floating FAB | ✅ READY | Hotline (`tel:9800000000`) available on all views |
| Cancellation & Reason Flow | Patient & Provider API | ✅ READY | Cancellation modal & status transition guards |

---

## 2. Beta Execution Log (Week 1–4)

### Week 1 — Closed Beta (Target: 10–15 Bookings)
- [ ] Onboard initial 5–10 verified nurses / health workers via partner clinic.
- [ ] Monitor first 10 bookings end-to-end.
- [ ] Track dispatch response time and patient feedback.

---

## 3. Incident & Fix Log

| Date | Incident Description | Severity | Resolution / Fix | Status |
|---|---|---|---|---|
| 2026-08-12 | Patient cancellation flow missing in initial build | Medium | Added cancellation endpoint & UI modal with reason tracking | FIXED |
| 2026-08-12 | Phone-in booking path needed dedicated dispatch UI | Medium | Added Phone-in Booking tab in Admin Dashboard | FIXED |
| 2026-08-12 | SMS alerts not fired on state transitions | High | Wired `sendSMS` into `createBooking`, `assignProvider`, `updateBookingStatus`, & `verifyProvider` | FIXED |

---

## 4. Key Metrics Tracker

- **Completion Rate Target:** > 85%
- **Target Time-to-Match:** < 15 minutes
- **No-Show Threshold:** 0% (Immediate follow-up on provider delay)
