# RotateStay

RotateStay is a platform that helps medical students swap or rent housing during clinical rotations. This repository contains the initial project scaffolding for the React frontend and Node.js/Express backend described in the RotateStay development blueprint.

## Project Structure

```
.
├── admin/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── index.css
│       ├── main.jsx
│       └── pages/
│           ├── CreateListing.jsx
│           ├── Dashboard.jsx
│           ├── Landing.jsx
│           ├── ListingDetail.jsx
│           ├── Listings.jsx
│           ├── Login.jsx
│           ├── Messages.jsx
│           └── Profile.jsx
├── database/
│   └── migrations/
├── server/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── controllers/
│       │   └── auth.controller.js
│       ├── middleware/
│       │   └── auth.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── booking.routes.js
│       │   ├── listing.routes.js
│       │   ├── message.routes.js
│       │   └── user.routes.js
│       ├── services/
│       │   ├── email.service.js
│       │   └── verification.service.js
│       ├── utils/
│       │   └── validation.js
│       └── server.js
└── .gitignore
```

## Getting Started

1. Install dependencies for the backend and frontend:

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Configure environment variables by copying `server/.env.example` to `.env` and providing real values.

3. Run database migrations with Prisma once a PostgreSQL database is available:

   ```bash
   npm run migrate
   ```

4. Start the backend and frontend development servers:

   ```bash
   # Backend
   cd server
   npm run dev

   # Frontend (separate terminal)
   cd client
   npm run dev
   ```

## Notes

- Authentication, listing management, bookings, messaging, and verification logic are scaffolded with placeholder routes to expand in future phases.
- Tailwind CSS is configured to provide the gradient-heavy visual style referenced in the RotateStay design blueprint.
- The Prisma schema models the core entities required for the RotateStay platform, including users, listings, bookings, swap requests, messages, and reviews.
