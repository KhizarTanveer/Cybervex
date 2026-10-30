# Job applications server (MongoDB)

Receives Careers-page applications (name, email, contact number, city, PDF
resume), stores them in MongoDB, and powers the admin panel (private address, see `src/lib/adminPath.js`).

What you'll see in **MongoDB Compass** (database `cybervex` by default):

| Collection         | Contents                                              |
| ------------------ | ----------------------------------------------------- |
| `job_applications` | one document per application, with its status         |
| `resumes.files`    | resume file info (name, size, upload date)            |
| `resumes.chunks`   | the PDF data itself (MongoDB GridFS)                  |
| `jobs`             | open positions shown on the Careers page              |
| `contact_messages` | messages sent from the Contact page                   |
| `projects`         | projects shown on the home page and Projects page     |
| `project_images.*` | images uploaded for projects (MongoDB GridFS)         |

## Setup

1. Copy `server/.env.example` to `server/.env` and fill in:
   - `MONGODB_URI` — `mongodb://localhost:27017` for MongoDB on this computer
     (the same address you connect to in Compass), or your Atlas string.
   - `ADMIN_EMAIL` — your admin panel email.
   - `ADMIN_PASSWORD_HASH` — run `npm run hash-password`, type the password
     (it stays hidden) and paste the line it prints. The password itself is
     never stored. Changing it signs out every admin session.
   - `SESSION_SECRET` — at least 32 random characters.
2. Run the server and the website in two terminals:

   ```
   npm run server     # API on http://localhost:4000
   npm run dev        # website on http://localhost:5173 (forwards /api to the server)
   ```

3. Open `/careers` to apply and the admin panel's private address to review applications.

## Going live

The website needs this server running wherever it is hosted. `npm start` builds
the site and serves the website **and** the API from one Node process, so any
Node host works (Render, Railway, a VPS, Hostinger/cPanel Node apps). Set the
same variables from `server/.env` in the host's environment settings, and use a
MongoDB Atlas connection string — a database on your own computer can't be
reached from the internet.

## Security

- **Admin sign-in:** 5 failed attempts per IP, and 25 overall, per 15 minutes —
  then sign-in pauses. Failed attempts are logged with the IP. **Sign out** ends
  the admin session on every device.
- **Production:** set `NODE_ENV=production` (secure cookies, HSTS; a plain
  `ADMIN_PASSWORD` is refused) and `TRUST_PROXY` to match your proxies — see
  `.env.example`. Without the right `TRUST_PROXY`, the limits can't tell
  visitors apart.
- **Headers:** helmet sets the Content-Security-Policy and other security
  headers (`server/security-headers.js`); `vercel.json` sets the same for the
  site on Vercel — keep the two policies in sync.
- **Forms:** the Contact and Apply forms carry a hidden `cvx_hp` field (kept out of
  browser autofill); anything that arrives with it filled in is treated as spam,
  dropped, and logged as `[spam] dropped …`.
- **Resumes** are downloaded, never opened inside the site.

## Email notifications

Set the `SMTP_*` values in `server/.env` (see `.env.example`). Each Contact
message and job application then sends:

- **to the team** (`NOTIFY_TO`): all the details, the resume attached for
  applications, and Reply-To set to the visitor, so pressing Reply answers them;
- **to the visitor**: a short confirmation. It never repeats what they typed,
  and these are capped at 60 an hour, so the forms can't be used to spam people.

The server log shows `[mail] ready` when the mailbox sign-in works. Emails go
out after the form has answered, so a mail problem never breaks the forms.
