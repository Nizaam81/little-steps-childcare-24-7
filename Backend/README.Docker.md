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