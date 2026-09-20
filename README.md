# Fix Mama

**Your voice. Your complaint. Your community.**

Flow: Login → OTP → Language → Camera → Detect → Confirm/correct → Speak or type → Review → Send to Fix Mama admin.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. `npm run dev` starts Vite and the local admin API together.

Copy `.env.example` to `.env` and set `FIX_MAMA_ADMIN_EMAIL`. Do not put that address in frontend code. Without a live email API key, messages are written to `server/outbox/` (mock).

Use Chrome for camera, location, and speech (te-IN / en-IN / hi-IN).

## Prototype notes

Complaints are received by **Fix Mama**, not a government portal. Admin can later file them on an official channel (`server/governmentChannel.js`).
