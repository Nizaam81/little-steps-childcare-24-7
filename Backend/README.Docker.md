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
```

Your application will be available at http://localhost:3000.

### Parent registration and email verification

The registration endpoints are mounted under `/api/parent`:

1. `POST /register` with `{ "fullName", "email", "phoneNumber" }` starts a pending registration.
2. `POST /register/send-otp` with `{ "email" }` sends a six-digit code to that email.
3. `POST /register/verify-otp` with `{ "email", "otp", "password" }` verifies the code, marks the email as verified, and saves a scrypt password hash.

OTP hashes are kept only in server memory for five minutes; they are not stored in MongoDB or browser storage. This means outstanding codes are lost on a server restart, and a multi-instance deployment needs a shared session/cache store.

Set the SMTP values in the same `.env` file to enable email delivery.

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