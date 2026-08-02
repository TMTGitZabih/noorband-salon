# NoorBand Salon — Full-Stack Website

A complete salon booking website: public site, WhatsApp-verified online booking,
an Artist dashboard, and an Admin dashboard. Built with Node.js, Express, EJS,
and MongoDB Atlas.

## Tech Stack

- **Frontend:** HTML5, CSS3 (custom, no framework), vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js, EJS templating
- **Database:** MongoDB Atlas (via Mongoose)
- **Auth:** express-session + connect-mongo, bcrypt password hashing
- **WhatsApp OTP:** Twilio WhatsApp API (falls back to console logging in dev)
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
utils/        WhatsApp sending, availability/slot calculation
seed/         Script to create an initial admin + sample data
```

## 1. Local Setup

**Requirements:** Node.js 18+, a MongoDB Atlas cluster, VS Code, Git.

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
- `TWILIO_*` — optional for local development. Leave blank and OTP codes will
  print to your terminal instead of sending a real WhatsApp message.

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

## 2. WhatsApp Verification (Twilio)

The booking flow requires customers to verify a 6-digit code sent to their
WhatsApp number before a booking is confirmed. This uses Twilio's WhatsApp API:

1. Create a free Twilio account at twilio.com.
2. In the Twilio Console, activate the WhatsApp Sandbox (or a production
   WhatsApp sender once approved).
3. Copy your Account SID and Auth Token into `.env` as `TWILIO_ACCOUNT_SID`
   and `TWILIO_AUTH_TOKEN`.
4. Set `TWILIO_WHATSAPP_FROM` to your Twilio WhatsApp number, formatted like
   `whatsapp:+14155238886`.

Without these set, the app still works end-to-end for development — codes are
printed to the server console instead of sent, so you can copy them manually
to test the verify screen.

## 3. Deploying to Render

1. Push this project to a GitHub repository.
2. In Render: **New → Web Service**, connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all the same environment variables from your `.env` under Render's
   **Environment** tab (use your real Atlas URI, a fresh `SESSION_SECRET`,
   and real Twilio credentials for production).
5. Deploy. Render's free tier spins down after 15 minutes of inactivity — for
   a live business site, use a paid instance type so there's no cold-start
   delay for customers booking appointments.
6. Once live, run the seed script once against production (e.g. via Render's
   Shell tab: `npm run seed`) to create your real admin account.

**Note on file uploads:** the gallery image upload feature saves files to
`public/images/uploads/` on disk. Render's disks are not persistent across
deploys on most plans — uploaded images will be lost on redeploy. For
production, swap `middleware/upload.js` for a cloud storage provider
(Cloudinary, AWS S3, etc.) and store the returned URL instead, or just use
the "Image URL" field in Admin → Gallery to link externally-hosted images.

## 4. Connecting the Domain (Namecheap → Render)

1. In Render, open your web service → **Settings → Custom Domains** → add
   `noorbandsalon.online` (and `www.noorbandsalon.online` if desired).
2. Render will show you a CNAME (or A record) target.
3. In Namecheap: **Domain List → Manage → Advanced DNS**, add the record
   Render gave you.
4. DNS propagation can take a few minutes to a few hours. Render issues a
   free TLS certificate automatically once the domain resolves.

## 5. Accounts & Roles

- **Admin:** full control — manage artists, services, bookings, gallery, and
  salon settings (contact info, opening hours).
- **Artist:** logs in to see only their own schedule, update their profile,
  change their password, and mark/cancel their own appointments. There is no
  public signup — admins create artist accounts from Admin → Artists.

## 6. Booking Flow (how double-booking is prevented)

1. Customer picks an artist, service, date; the server computes free time
   slots from the artist's working hours minus existing bookings
   (`utils/availability.js`).
2. On submit, the server re-checks availability before creating the booking
   (status `pending_verification`) — closing the race-condition window.
3. A 6-digit code is sent to the customer's WhatsApp number.
4. The customer enters the code; on success the booking flips to `confirmed`,
   the slot is now permanently taken, and both customer and salon are
   notified.
5. Abandoned (never-verified) holds automatically stop blocking the slot
   after 10 minutes.

## 7. Security Notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- Sessions are stored server-side in MongoDB (not client-side JWTs), with
  `httpOnly` cookies and `secure` cookies in production.
- All forms are validated server-side with `express-validator`.
- Artists can only ever query/modify bookings tied to their own artist
  profile — enforced in `controllers/artistDashboardController.js`.
- Set `NODE_ENV=production` on Render so error pages don't leak stack traces
  and cookies are marked secure.
