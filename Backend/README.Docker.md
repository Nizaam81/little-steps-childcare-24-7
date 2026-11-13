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
CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret
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
   password, uploads documents to Cloudinary, stores Cloudinary URLs and
   public IDs in MongoDB, and returns
   `{ "applicationId", "status": "pending_verification" }`.

Multer temporarily receives files in `storage/provider-applications`; the
backend removes each temporary file after its Cloudinary upload succeeds.
Cloudinary assets use the `Little_Steps/provider-applications` folder. OTP
state currently lives in process memory, so codes are lost on restarts and a
multi-instance production deployment should use a shared cache. Keep
Cloudinary credentials private and restrict access to application documents.

Providers can sign in with `POST /api/providers/login` using
`{ "email": "...", "password": "..." }`. A successful login always returns the
application status and review notes. Only an `approved` provider receives a
session token and `dashboardAccess: true`; pending, rejected, and
corrections-requested applications receive no token.
Providers can log out with `POST /api/providers/logout` (also available at
`POST /api/childcare/logout`).

### Admin login and provider review

Admins are provisioned manually in MongoDB using the `Admin` model. Store a
scrypt password hash in `passwordHash` (generate it with the shared
`hashPassword()` utility); never store a plaintext password. Set `isAdmin` to
`true` for accounts allowed to sign in. Accounts with `isAdmin: false` cannot
log in. There is no public admin registration or password-reset endpoint.

1. `POST /api/admin/login` with `{ "email", "password" }` returns an admin JWT.
   The token expires after 12 hours and is signed using `JWT_ACCESS_SECRET`.
2. Send that token as `Authorization: Bearer <token>` to all admin endpoints.
3. `POST /api/admin/logout` ends the client session.
4. `GET /api/admin/providers` lists applications; optionally filter with
   `?status=pending_verification`, `approved`, `rejected`, or
   `corrections_requested`.
5. `GET /api/admin/providers/:applicationId/documents?publicId=<encoded-public-id>`
   redirects to the matching Cloudinary document. This endpoint is
   admin-authenticated.
6. `PATCH /api/admin/providers/:applicationId/review` with
   `{ "status": "approved" | "rejected" | "corrections_requested",
   "reviewNotes": "..." }` records the decision. A reason is required when
   rejecting or requesting corrections. Pending applications and applications
   awaiting corrections can be reviewed; approved and rejected applications
   are terminal.

Admin tokens contain an explicit admin role and `isAdmin: true`; parent
session tokens are not accepted by admin routes. Configure a private,
stable `JWT_ACCESS_SECRET` of at least 32 characters and protect it like a
credential.

### Parent login and logout

`POST /api/parent/login` accepts `{ "email", "password", "rememberMe" }`.
The email is normalized and validated, and `rememberMe` is optional (defaults
to `false`). Successful login returns a signed JWT in the response body; the
token expires after 12 hours by default or 30 days when `rememberMe` is `true`.
Use `POST /api/parent/logout` to end the client session.

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` to separate, unique,
randomly generated secrets of at least 32 characters. The current login flow
uses `JWT_ACCESS_SECRET` to sign the parent session JWT; refresh-token issuance
is not implemented yet. Keep the access secret private and stable across app
instances; changing it invalidates existing parent session tokens.

Logout endpoints return success so clients can clear their stored access token.
JWT logout is client-side only: tokens are not revoked by the server and remain
valid until they expire.

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