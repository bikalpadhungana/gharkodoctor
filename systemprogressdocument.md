# GharkoDoctor — System Progress Document

**Pattern:** Living Log of Development Progress  
**Last Updated:** August 14, 2026  
**Status:** FlapMain IoT & Telemetry Test Suite Implemented, World-Class System Home Page UI, Desktop & Mobile Viewports, Audited, SEO-Optimized, Map Picker, Logo Branding, Coverage Radius, Medical Visit Reports, Super Admin Audit Log System, Comprehensive Bilingual Language Engine, Backend Dist Directory & Standalone Server Deployment Implemented  

---

## 1. System Overview & Architecture Implemented

- **Stack:** Full MERN (MongoDB, Express.js, React + Vite, Node.js) + Socket.io Integration.
- **FlapMain IoT & Sensor Telemetry Test Suite (`/admin/dashboard` → `FlapMain IoT Test` Tab):**
  - **Scale Measurement Trigger Session (`POST /v1/devices/:device_id/trigger`)**: Configurable target device ID (`flap-weight-fqs5`), patient ID, callback webhook URL, and metadata notes.
  - **Live Scale Reading & Status Polling (`GET /v1/devices/:device_id/trigger-status`)**: Interactive polling & auto-refresh (3s) with gauge cards for Weight (kg), Height (cm), BMI, and timestamp.
  - **NFC Tag & Card Reader Lookup (`POST /tags/lookup`)**: NFC tag UID lookup (`04:A1:B2:C3:D4:E5:F6`) with cardholder identity and OLED screen text rendering.
  - **Real-Time WebSocket Console (Socket.io)**: Live connection state badge (`wss://main.esainnovation.com`) and stream log for `device_trigger_initiated`, `scale_measurement_completed`, and `new_scale_reading` events.
  - **Backend Integration Proxy (`/api/admin/telemetry/*`)**: Express backend proxy routes in `adminController.js` and `admin.js` to eliminate CORS and authentication header issues when testing FlapMain endpoints.

---

## 2. Backend Implementation (`/backend`)

### FlapMain Telemetry Proxy Endpoints
- `POST /api/admin/telemetry/trigger`: Proxies trigger requests to `https://main.esainnovation.com/api/v1/devices/:device_id/trigger` with partner key and device credentials.
- `POST /api/admin/telemetry/status`: Proxies polling requests to `https://main.esainnovation.com/api/v1/devices/:device_id/trigger-status`.
- `POST /api/admin/telemetry/tag-lookup`: Proxies card lookup requests to `https://main.esainnovation.com/api/tags/lookup`.

---

## 3. Verification & Testing

- **Frontend Build:** Executed `npm run build` — compiled cleanly into `frontend/dist/` in 756ms and copied to `backend/dist/`.
- **Backend Syntax Check:** Passed `node -c controllers/adminController.js` and `node -c routes/admin.js` with 0 errors.
