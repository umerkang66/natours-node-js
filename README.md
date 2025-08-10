# Natours (Node.js, Express, MongoDB)

A full‑stack application that serves a server‑side rendered website and a REST API for managing tours, users, reviews, and bookings. Built with Node.js, Express, MongoDB/Mongoose, and Pug templates. Includes authentication with JWT, image upload & processing, security hardening, rate limiting, and Stripe checkout webhook support.

## Tech Stack
- Node.js 18+
- Express 4
- MongoDB with Mongoose
- Pug (views)
- Parcel (bundles client JS)
- Stripe (payments)
- Nodemailer (emails)
- Sharp (image processing)
- Various security middlewares: helmet (via Express defaults), express-rate-limit, express-mongo-sanitize, xss-clean, hpp, compression, cors

## Features
- SSR website (Pug) served from Express
- REST API: /api/v1/tours, /api/v1/users, /api/v1/reviews, /api/v1/bookings
- Authentication/authorization with JWT (cookies supported)
- Image upload (users, tours) with resizing (Sharp)
- Stripe webhook endpoint for checkout: POST /webhook-checkout (expects raw body)
- Security: CORS, rate limiting, sanitization against NoSQL injection & XSS, HPP, compression
- Dev data seeding/clearing scripts

## Prerequisites
- Node.js 18 (project declares "engines": { "node": "^18" })
- A MongoDB database (Atlas recommended)
- Stripe account (for STRIPE_SECRET_KEY and webhook secret)
- Email provider credentials (Mailtrap for dev is fine)

## Getting Started

1) Install dependencies
- npm install

2) Configure environment variables
- Copy config.env.example to config.env and fill in values:
  - PORT: Port to run the app (default 3000)
  - DATABASE: Your MongoDB connection string containing <PASSWORD> placeholder. Example:
    mongodb+srv://<user>:<PASSWORD>@cluster.example.mongodb.net/natours?retryWrites=true&w=majority
  - DATABASE_PASSWORD: The password that will replace <PASSWORD> in DATABASE at runtime
  - JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES_IN: Auth config
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: Payments & webhook verification
  - EMAIL_* (HOST, PORT, USERNAME, PASSWORD, FROM): Email transport settings
  - SEND_IN_BLUE_USERNAME, SEND_IN_BLUE_PASSWORD: Optional alt email provider

3) Build or watch client assets (optional for dev)
- Watch (rebuilds on change): npm run watch:js
- Build once: npm run build:js

## Running the App

Development (recommended):
- Start the server with auto‑reload: npm run start:dev
- In another terminal, run asset watcher (optional): npm run watch:js
- App will listen on http://localhost:3000 (or PORT in config.env)

Production:
- Ensure NODE_ENV=production and run the server. On PowerShell (Windows):
  $env:NODE_ENV = 'production'; node server.js
- Or use the provided script on environments that support POSIX env prefixing:
  npm run start:prod

Notes:
- Do not place any body parsers before the Stripe webhook route; this app already handles that in src/app.js.
- Static files are served from /public.

## Seeding Development Data
A helper script loads sample Tours, Users, and Reviews into your database.
- Import sample data:
  node dev-data/data/import-dev-data.js --import
- Delete all sample data:
  node dev-data/data/import-dev-data.js --delete
Make sure your config.env DATABASE and DATABASE_PASSWORD are valid before running the script.

## Project Structure
- server.js: Loads env, connects MongoDB, starts HTTP server, handles process‑level errors
- src/app.js: Express app setup (security, parsers, static, views, routes, global error handler)
- src/routes: Route modules for API and views
- src/controllers: Business logic, error controller, Stripe webhook
- src/models: Mongoose models (Tour, User, Review, Booking)
- src/views: Pug templates for SSR (overview, tour, login, account, email)
- src/utils: Helpers (errors, async wrapper, email, image upload/resize)
- public: Static assets (CSS, images, client JS bundle)
- dev-data: JSON and seed script

## Available NPM Scripts
- start: node server.js
- start:dev: nodemon server.js
- start:prod: NODE_ENV=production nodemon server.js (POSIX style; on Windows, prefer PowerShell command shown above)
- watch:js: parcel watch ./public/js/index.js --out-dir ./public/js --out-file bundle.js
- build:js: parcel build ./public/js/index.js --out-dir ./public/js --out-file bundle.js

## Endpoints (high level)
- Views: /
- API: /api/v1/tours, /api/v1/users, /api/v1/reviews, /api/v1/bookings

## Credits
This project was built while following Jonas Schmedtmann's Node.js course on Udemy.
