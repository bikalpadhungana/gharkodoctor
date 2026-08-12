# GharkoDoctor — SEO Strategy & Market Dominance Plan

**Target Market:** Kathmandu Valley (Kathmandu, Lalitpur, Bhaktapur) & Nepal Nationwide  
**Goal:** Outrank all existing health providers (Clinic One at Home, Hamro Patro Health, HAMS at Home, Doctors Home Call) for every medical and home-health search query in Nepal.

---

## 1. Competitor Landscape & Strategy to Overcome Them

| Competitor | Primary Offerings | Strengths | SEO Weaknesses / Gaps We Exploit |
|---|---|---|---|
| **Clinic One at Home** | Home doctor visit, PCR, lab test, USG, pharmacy delivery | Established brand in Lalitpur/KTM | English-first, heavy clinic focus, lacks trust verification badges for individual nurses, expensive |
| **Hamro Patro Health** | Telemedicine, doctor consultation, lab test booking | Huge app user base via Hamro Patro | Teleconsultation focus, weak local ward-level SEO landing pages, no instant Cash-on-Visit trust guarantee |
| **HAMS at Home** | Hospital-backed home visits, nursing, physio | High hospital brand trust | Institutional feel, complex booking flow, slow response time for emergency/hyperlocal requests |
| **Doctors Home Call Nepal** | Elderly care, wound dressing, nursing | Strong offline reputation | Very basic web presence, minimal SEO structure, missing Devanagari voice-search keywords |

### **Our Advantage & SEO Weapon:**
1. **Hyperlocal Ward-Level Targeting:** Ranking for specific ward searches (e.g. *"home nurse in Ward 4 Baluwatar"*, *"doctor visit in Baneshwor"*, *"नर्स भिजिट कुपण्डोल"*).
2. **Dual Language Dominance (Bilingual SEO):** Equal optimization for English and Devanagari/Nepali search terms (voice search friendly).
3. **Structured Schema Supremacy:** Rich `MedicalBusiness` & `LocalBusiness` JSON-LD schemas with explicit price ranges (रु. 200 - रु. 3000) and verified provider credentials.
4. **PWA Mobile Speed & Accessibility:** 3G-optimized, fast LCP, zero app store barrier.

---

## 2. High-Intent Keyword Matrix (Target Search Queries)

### A. Core High-Intent English Keywords
- `doctor home visit kathmandu`
- `home nursing service kathmandu nepal`
- `nurse visit at home kathmandu`
- `home IV injection service kathmandu`
- `blood sample collection at home kathmandu`
- `elderly health care at home nepal`
- `home wound dressing service kathmandu`
- `call doctor home visit lalitpur bhaktapur`
- `at home medical test kathmandu`

### B. High-Intent Devanagari / Nepali Search Terms (Voice & Local Search)
- `घरमा डाक्टर सेवा काठमाडौं` (Gharma doctor sewa kathmandu)
- `घरमै नर्स सेवा` (Gharmayi nursing sewa)
- `घरमै IV सुई लगाउने सेवा` (Gharmayi IV sui lagaune sewa)
- `ज्येष्ठ नागरिक हेरचाह घरमा काठमाडौं` (Jyestha nagarik herchah gharma kathmandu)
- `घरमै रगत जाँच सेवा` (Gharmayi ragat jaanch sewa)
- `घरको डाक्टर` (Gharko Doctor)
- `घरमै घाउ मलमपट्टी` (Gharmayi ghaau malampatti)

### C. Healthcare Provider Recruitment Keywords
- `home care nurse jobs kathmandu`
- `nurse vacancy home visit nepal`
- `doctor home call jobs kathmandu`
- `स्वास्थ्यकर्मी काम काठमाडौं`

---

## 3. Implemented On-Page & Technical SEO

1. **Meta & OpenGraph Infrastructure (`index.html` & `SEO.jsx`):**
   - Canonical URLs (`https://gharkodoctor.com/`)
   - Bilingual Titles & Meta Descriptions
   - OpenGraph `og:locale` set to `ne_NP` with `en_US` alternate
   - Twitter Card summary tags

2. **JSON-LD Schema (`index.html`):**
   - `MedicalBusiness` schema with `priceRange`, `openingHoursSpecification`, `geo` coordinates, and `availableService` definitions for all 6 core medical services.

3. **Crawlability & Indexing:**
   - [robots.txt](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/public/robots.txt) configured to allow search engines while disallowing internal `/admin/` and `/provider/` paths.
   - [sitemap.xml](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/public/sitemap.xml) created with bilingual alternate links and page priority definitions.
   - [manifest.json](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/public/manifest.json) PWA discovery file.

4. **Heading Hierarchy:**
   - Single semantic `<h1>` per page, followed by clean `<h2>` and `<h3>` tags.

---

## 4. Local SEO & Content Expansion Playbook (Phase 2 & 3)

1. **Google Business Profile (GBP) Optimization:**
   - Claim & verify **GharkoDoctor — Home Medical Visit Service Kathmandu**.
   - Select Primary Category: *Home Health Care Service*, Secondary: *Doctor, Nursing Agency, Medical Clinic*.
   - Add phone number `9800000000` and link to PWA.

2. **Ward Landing Pages Strategy:**
   - Build dynamic route `/services/:serviceSlug/location/:wardSlug` (e.g., `/services/home-nurse-visit/kathmandu-ward-4`).
   - Deliver localized content for each major municipality (Kathmandu, Lalitpur, Bhaktapur, Thimi, Kirtipur).

3. **Patient Education Blog (Health Articles):**
   - Target informational queries: *"When does an elderly person need home nursing in Nepal?"*, *"How to administer IV fluids safely at home in Kathmandu"*.
