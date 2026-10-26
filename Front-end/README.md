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
