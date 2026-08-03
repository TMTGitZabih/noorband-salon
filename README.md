# NoorBand Salon — Full-Stack Website

A complete salon booking website: public site, instant online booking, an
Artist dashboard, and an Admin dashboard. Built with Node.js, Express, EJS,
and MongoDB Atlas.

## Tech Stack

- **Frontend:** HTML5, CSS3 (custom, no framework), vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js, EJS templating
- **Database:** MongoDB Atlas (via Mongoose)
- **Auth:** express-session + connect-mongo, plain-text passwords (see Security Notes)
- **Deployment:** Render, with the domain `noorbandsalon.online` (Namecheap) pointed at it

## Project Structure

```
config/       Database connection, salon defaults
controllers/  Route logic, grouped by feature
middleware/   Auth guards, error handling, validation, file upload, settings loader
models/       Mongoose schemas: User, Artist, Service, Booking, GalleryImage, Setting
routes/       Express routers, grouped by feature
views/        EJS templates (layouts, partials, pages, dashboards)
public/       Static CSS, JS, images
utils/        Availability/slot calculation
seed/         Script to create an initial admin + sample data
```

## 1. Local Setup

**Requirements:** Node.js 20.8+, a MongoDB Atlas cluster, VS Code, Git.

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — from Atlas: Database → Connect → Drivers → copy the connection
  string, replace `<db-user>`/`<db-password>` with a **Database Access** user
  you create in Atlas (Database Access tab, not your Atlas login).
- `SESSION_SECRET` — generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the admin account the seed script creates.
- Salon contact fields (`SALON_*`) — used only as the *first-time default*;
  after that, edit them from Admin → Settings instead.

In MongoDB Atlas, go to **Network Access** and allow your IP (or `0.0.0.0/0`
for quick local testing).

Seed the database with an admin account, sample services, and two sample artists:

```bash
npm run seed
```

Start the app:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start
```

Visit `http://localhost:3000`. Log in at `/login` with the admin credentials
from your `.env`.

## 2. Deploying to Render

1. Push this project to a GitHub repository.
2. In Render: **New → Web Service**, connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all the same environment variables from your `.env` under Render's
   **Environment** tab (use your real Atlas URI and a fresh `SESSION_SECRET`).
5. Deploy. Render's free tier spins down after 15 minutes of inactivity — for
   a live business site, use a paid instance type so there's no cold-start
   delay for customers booking appointments.
6. Once live, run the seed script once against production (from your own
   computer, with `.env`'s `MONGODB_URI` pointed at the same Atlas database
   Render uses — Render's free tier doesn't include Shell access) to create
   your real admin account.

**Note on file uploads:** the gallery image upload feature saves files to
`public/images/uploads/` on disk. Render's disks are not persistent across
deploys on most plans — uploaded images will be lost on redeploy. For
production, swap `middleware/upload.js` for a cloud storage provider
(Cloudinary, AWS S3, etc.) and store the returned URL instead, or just use
the "Image URL" field in Admin → Gallery to link externally-hosted images.

## 3. Connecting the Domain (Namecheap → Render)

1. In Render, open your web service → **Settings → Custom Domains** → add
   `noorbandsalon.online` (and `www.noorbandsalon.online` if desired).
2. In Namecheap: **Domain List → Manage → Advanced DNS**, remove any existing
   `A`/`CNAME`/redirect records for `@` and `www`, then add an `A` record for
   `@` pointing to `216.24.57.1`, and a `CNAME` record for `www` pointing to
   your `*.onrender.com` subdomain.
3. Back in Render, click **Verify** next to the domain. DNS propagation can
   take a few minutes to a few hours. Render issues a free TLS certificate
   automatically once the domain verifies.

## 4. Accounts & Roles

- **Admin:** full control — manage artists, services, bookings, gallery, and
  salon settings (contact info, opening hours).
- **Artist:** logs in to see only their own schedule, update their profile,
  change their password, and mark/cancel their own appointments. There is no
  public signup — admins create artist accounts from Admin → Artists.

Passwords are stored in plain text (see Security Notes below), so you can
view or change any account's password directly in MongoDB (via mongosh or
Atlas) without generating a hash — just edit the `password` field on the
matching document in the `users` collection.

## 5. Booking Flow (how double-booking is prevented)

1. Customer picks an artist, service, date; the server computes free time
   slots from the artist's working hours minus existing bookings
   (`utils/availability.js`).
2. On submit, the server re-checks availability before creating the booking
   as `confirmed` — closing the race-condition window between two customers
   trying to book the same slot at once.
3. The customer is taken straight to a confirmation page. There is no
   verification step.

## 6. Security Notes

This project intentionally trades away some security for simplicity:

- **Passwords are stored in plain text, not hashed.** Anyone with database
  access can read every password as-is. Do not reuse this pattern for a site
  handling sensitive customer data, payments, or anything beyond a small
  personal/student project.
- Sessions are stored server-side in MongoDB (not client-side JWTs), with
  `httpOnly` cookies, and `secure` cookies are set automatically based on
  whether the request actually arrived over HTTPS (`cookie.secure: 'auto'`
  combined with `app.set('trust proxy', 1)` in `server.js`, which is required
  for this detection to work correctly behind Render's proxy).
- All forms are validated server-side with `express-validator`.
- Artists can only ever query/modify bookings tied to their own artist
  profile — enforced in `controllers/artistDashboardController.js`.
