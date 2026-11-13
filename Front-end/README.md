# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Daycare provider registration API

The provider registration UI is available at `/provider/register`. It is a
six-step client-side flow and submits only after the owner reviews and confirms
the application. The frontend connects to the childcare routes mounted by the
backend at `/api/childcare`:

To unlock the rest of the owner account form, the frontend first requests a
6-digit email code and verifies it with these JSON endpoints:

```text
POST {VITE_API_BASE_URL}/api/childcare/registrations/email-verification/send
{ "email": "owner@example.com" }

POST {VITE_API_BASE_URL}/api/childcare/registrations/email-verification/verify
{ "email": "owner@example.com", "otp": "123456" }
```

The send endpoint returns HTTP `200` after sending the code. The verify
endpoint returns HTTP `200` with `{ "verified": true }` only for a valid,
unexpired code. Changing the email in the form clears its verified status, so
the new address must be verified separately.
The backend should bind codes to the normalized email address, expire them,
limit verification attempts and send frequency, and independently require a
verified email when creating the registration; the client-side verified state
must not be treated as proof by itself.

After email verification, the remaining registration uses:

```text
POST {VITE_API_BASE_URL}/api/childcare/registrations
Content-Type: multipart/form-data
```

The multipart request contains:

- `application`: JSON string with `ownerName`, `ownerEmail`, `ownerPhone`,
  `password`, `centreName`, `address`, `district`, `centreEmail`,
  `centrePhone`, `ageGroups`, `careTypes`, `capacity`, `openingTime`,
  `closingTime`, `dailyPrice`, and `monthlyPrice`.
- `tradeLicense`: one required PDF, JPG, or PNG file (up to 10 MB).
- `supportingDocuments`: up to 10 PDF, JPG, or PNG files (up to 10 MB each).

On success, return HTTP `201` and JSON in this shape:

```json
{
  "applicationId": "your-application-reference",
  "status": "pending_verification"
}
```

The UI displays the admin-verification status only after receiving that
successful response. The backend should validate all submitted data, securely
hash the owner password, store uploaded files safely, and enforce HTTPS in
production. Configure `VITE_API_BASE_URL` to point to the backend API origin.

## Parent dashboard

The parent dashboard is available at `/parent/dashboard` after a successful
sign-in. Run the frontend from `Front-end` with `npm run dev` (usually
`http://localhost:5173`) and the backend with `docker compose up --build` from
`Backend` (usually `http://localhost:3000`). Set `VITE_API_BASE_URL` to the
backend origin when it is not `http://localhost:3000`.

Parent app routes:

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/register` | Parent registration |
| `/login` | Parent sign-in |
| `/parent/dashboard` | Parent dashboard |
| `/contact` | Contact page (replace demo contact details before launch) |
| `/privacy` | Privacy information |
| `/terms` | Draft terms and conditions |

Parent sign-in navigates to `/parent/dashboard` after a successful login.
The dashboard footer links to Contact, Privacy, Terms & Conditions, and Trust
& Safety. Contact email/phone are visibly marked placeholders; replace them
in `src/config/siteContact.ts` before launch. The Privacy and Terms pages are
preview drafts and need review against the final production service.

From the repository root, start the backend and frontend in separate terminals:

```powershell
Set-Location .\Backend
docker compose up --build
```

```powershell
Set-Location .\Front-end
npm install
npm run dev
```

The currently implemented parent API endpoint is:

```text
POST {VITE_API_BASE_URL}/api/parent/login
{ "email": "parent@example.com", "password": "your-password", "rememberMe": false }
```

The dashboard's childcare listings, favorites, bookings, notifications,
subscription, camera-access requests, caregiver recommendations, and payment
history are sample data and browser-session interactions only. The browser
location is requested with the user's permission and stays in the frontend.
The dashboard keeps the discovery and summary view uncluttered; open
**Settings & history** from the profile menu to access the detailed activity
and feature previews. **Edit profile** opens the parent contact form. Profile
changes are kept in the current page session only until a profile API is added.
Camera feeds, recommendation services, and payment/refund processing are not
connected; the demo UI does not start a stream, send a provider request, charge
a card, or issue a refund. The backend does not currently implement dashboard
endpoints for these features.

Suggested endpoints to implement when these backend features are ready:

```text
GET    /api/childcare/centers?search=&ageGroup=&careTiming=&available24=&maxMonthlyPrice=&sort=
GET    /api/parent/favorites
PUT    /api/parent/favorites/:centerId
DELETE /api/parent/favorites/:centerId
GET    /api/parent/bookings
POST   /api/parent/bookings             { "centerId": "...", "plan": "...", "startDate": "YYYY-MM-DD" }
GET    /api/parent/notifications
GET    /api/parent/subscription
GET    /api/parent/camera-access
POST   /api/parent/camera-access             { "centerId": "...", "cameraId": "..." }
GET    /api/parent/caregiver-recommendations?ageGroup=&careStyle=
GET    /api/parent/payments
POST   /api/parent/payments/:paymentId/refund
```

These suggested endpoints are not implemented yet; the frontend deliberately
does not call them.
