### Building and running your application

Put your MongoDB and SMTP settings together in the existing `Backend/.env` file, then run `docker compose up --build`. Do not commit this file or share its credentials.

The `.env` file should include:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your-mongodb-connection-string
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=your-sender-email
JWT_ACCESS_SECRET=replace-with-a-unique-random-access-secret-of-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-a-unique-random-refresh-secret-of-at-least-32-characters
```

Your application will be available at http://localhost:3000.

### Parent registration and email verification

The registration endpoints are mounted under `/api/parent`:

1. `POST /register` with `{ "fullName", "email", "phoneNumber" }` starts a pending registration.
2. `POST /register/send-otp` with `{ "email" }` sends a six-digit code to that email.
3. `POST /register/verify-otp` with `{ "email", "otp", "password" }` verifies the code, marks the email as verified, and saves a scrypt password hash.

OTP hashes are kept only in server memory for five minutes; they are not stored in MongoDB or browser storage. This means outstanding codes are lost on a server restart, and a multi-instance deployment needs a shared session/cache store.

Set the SMTP values in the same `.env` file to enable email delivery.

### Childcare provider registration

The childcare provider onboarding API is mounted under `/api/providers`:

1. `POST /registrations/email-verification/send` with `{ "email" }` sends an
   owner-specific six-digit OTP. Resends are limited to once per minute.
2. `POST /registrations/email-verification/verify` with `{ "email", "otp" }`
   returns `{ "verified": true }` for a valid code. Codes expire after five
   minutes and allow at most five attempts.
3. `POST /registrations` accepts `multipart/form-data` with an `application`
   JSON field, one `tradeLicense` PDF/JPG/PNG file, and up to ten
   `supportingDocuments` PDF/JPG/PNG files. Each file can be at most 10 MB.
   The backend validates the owner email verification again, hashes the
   password, stores documents outside the public web root, and returns
   `{ "applicationId", "status": "pending_verification" }`.

Documents are stored in the Docker `provider-documents` volume by default. Set
`PROVIDER_DOCUMENTS_DIR` to use a different private persistent directory. OTP
state currently lives in process memory, so codes are lost on restarts and a
multi-instance production deployment should use a shared cache. Use HTTPS in
production and restrict access to stored application documents.

### Admin login and provider review

Admins are provisioned manually in MongoDB using the `Admin` model. Store a
scrypt password hash in `passwordHash` (generate it with the shared
`hashPassword()` utility); never store a plaintext password. Set `isAdmin` to
`true` for accounts allowed to sign in. Accounts with `isAdmin: false` cannot
log in. There is no public admin registration or password-reset endpoint.

1. `POST /api/admin/login` with `{ "email", "password" }` returns an admin JWT.
   The token expires after 12 hours and is signed using `JWT_ACCESS_SECRET`.
2. Send that token as `Authorization: Bearer <token>` to all admin endpoints.
3. `GET /api/admin/providers` lists applications; optionally filter with
   `?status=pending_verification`, `approved`, `rejected`, or
   `corrections_requested`.
4. `GET /api/admin/providers/:applicationId/documents/:storedName` downloads
   an application document. This endpoint is admin-authenticated and does not
   expose the document storage path.
5. `PATCH /api/admin/providers/:applicationId/review` with
   `{ "status": "approved" | "rejected" | "corrections_requested",
   "reviewNotes": "..." }` records the decision. A reason is required when
   rejecting or requesting corrections. Pending applications and applications
   awaiting corrections can be reviewed; approved and rejected applications
   are terminal.

Admin tokens contain an explicit admin role and `isAdmin: true`; parent
session tokens are not accepted by admin routes. Configure a private,
stable `JWT_ACCESS_SECRET` of at least 32 characters and protect it like a
credential.

### Parent login

`POST /api/parent/login` accepts `{ "email", "password", "rememberMe" }`.
The email is normalized and validated, and `rememberMe` is optional (defaults
to `false`). Successful login sets the signed JWT in the HttpOnly
`parent_session` cookie; the token is not returned in the response body. The
cookie expires with the token: 12 hours by default or 30 days when
`rememberMe` is `true`.

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` to separate, unique,
randomly generated secrets of at least 32 characters. The current login flow
uses `JWT_ACCESS_SECRET` to sign the parent session JWT; refresh-token issuance
is not implemented yet. Keep the access secret private and stable across app
instances; changing it invalidates existing parent session tokens.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)