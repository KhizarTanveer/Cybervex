# Job applications server (MongoDB)

Receives Careers-page applications (name, email, contact number, city, PDF
resume), stores them in MongoDB, and powers the admin panel at `/admin`.

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
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your admin panel login.
   - `SESSION_SECRET` — any long random text.
2. Run the server and the website in two terminals:

   ```
   npm run server     # API on http://localhost:4000
   npm run dev        # website on http://localhost:5173 (forwards /api to the server)
   ```

3. Open `/careers` to apply and `/admin` to review applications.

## Going live

The website needs this server running wherever it is hosted. `npm start` builds
the site and serves the website **and** the API from one Node process, so any
Node host works (Render, Railway, a VPS, Hostinger/cPanel Node apps). Set the
same variables from `server/.env` in the host's environment settings, and use a
MongoDB Atlas connection string — a database on your own computer can't be
reached from the internet.
