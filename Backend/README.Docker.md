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
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-signing-secret
STRIPE_PRODUCT_ID=prod_Ve26LG6soGMSFL
STRIPE_PRICE_ID=price_1Uck1r0T9XxP3pFMKbrbd2gP
```

Your application will be available at http://localhost:3000.

Stripe subscription checkout uses the configured recurring Price ID. Keep the Stripe secret key and webhook signing secret only in the backend `.env` or deployment environment. Configure a Stripe webhook to send `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` events to `https://your-api-host/api/stripe/webhook`. For local development, forward those events to `http://localhost:3000/api/stripe/webhook` using the Stripe CLI and set its webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

The Stripe secret key must match the test or live mode used by the configured Product and Price IDs. This integration uses Stripe-hosted Checkout and does not require the publishable key.

The configured recurring price must be ₹499 INR per month. Providers can access the dashboard and read-only workspace without a subscription. Profile, caregiver, schedule, photo, booking-decision, and camera-access changes require both an admin-approved active centre and an active subscription; subscription state is verified from backend records updated by Stripe webhooks. `STRIPE_PAST_DUE_GRACE_DAYS` is optional and defaults to `0`.

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

1. `POST /api/admin/login` with `{ "email", "password" }` returns an admin
   access token and refresh token.
2. Send the access token as `Authorization: Bearer <accessToken>` to all admin endpoints.
3. `POST /api/admin/logout` revokes the current server-side session.
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

Admin tokens contain an explicit admin role; parent and provider tokens are
not accepted by admin routes. Configure private, stable `JWT_ACCESS_SECRET`
and `JWT_REFRESH_SECRET` values of at least 32 characters each.

### Parent login and logout

`POST /api/parent/login` accepts `{ "email", "password", "rememberMe" }` and
returns a short-lived access token and a rotating refresh token. When an
access token expires, send `POST /api/auth/refresh` with
`{ "refreshToken": "..." }`; each refresh token can be used once. Refresh
sessions are stored in MongoDB, and logout revokes the server-side session and
blacklists its active access token.

`GET /api/auth/session` verifies the current server-side session and returns
the authenticated role. Dashboard routes use this check (and refresh an
expired access token when possible); signed-in users are redirected away from
login pages. Backend routes still enforce bearer-token authentication and
role-specific authorization independently of the frontend.

Parent endpoints require a parent access token:

* `GET /api/parent/profile` and `PATCH /api/parent/profile` read and update the
  authenticated parent's name and phone number.
* `GET /api/parent/centres?search=<text>` lists approved, active daycare
  centres. Filter by district or search by centre/address in the client.
* `GET /api/parent/caregivers/recommended` lists caregiver profiles associated
  with approved centres, ordered by parent review count.
* `GET /api/parent/wishlist`, `POST /api/parent/wishlist`, and
  `DELETE /api/parent/wishlist/:targetType/:targetId` manage saved centres and
  caregivers.
* `POST /api/parent/feedback` accepts `{ "targetType", "targetId", "rating",
  "comment" }` for a 1–5 star daycare or caregiver review. A parent can review
  each target once.
* `GET /api/parent/notifications` and
  `PATCH /api/parent/notifications/:notificationId/read` manage in-app
  notifications.
* `POST /api/parent/bookings` accepts `{ "centreId", "childName", "carePlan",
  "requestedDate", "bookingStartDate", "bookingEndDate" }` and sends a request
  to an approved daycare. Overlapping accepted periods (including an active
  booking) are rejected. Providers can accept or reject requests from their
  authenticated workspace; decisions create a parent notification.
  Parents can request camera access for an active accepted booking at
  `POST /api/parent/bookings/:bookingId/camera-access`; providers approve or
  decline that request at
  `PATCH /api/childcare/workspace/bookings/:bookingId/camera-access`.

Provider dashboard endpoints under `/api/childcare/workspace` require an
approved provider access token. They support reading/updating the centre
profile, managing centre-specific caregiver profiles, and accepting or
rejecting booking requests. `POST /api/childcare/workspace/photos` accepts one
multipart `photo` field (JPG, PNG or WebP, max 5 MB); a centre may store up to
four photos in the configured Cloudinary account. Delete a photo with
`DELETE /api/childcare/workspace/photos/:photoId`. Admin, parent, and provider
endpoints enforce their token role on the server.

Providers can view their workspace and billing details without a current
subscription, but profile changes, photo/caregiver management, and booking or
camera-access actions require an active subscription. Requests to those
features return `402` when a subscription is missing, inactive, or past its
current period end. The backend emails the provider owner seven days before
the current period ends; SMTP settings are required for delivery.

Parent daycare details show the centre's uploaded gallery. The active-booking
view offers a camera-access prompt; live camera streaming requires a separate
camera service and is not provided by this API.

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