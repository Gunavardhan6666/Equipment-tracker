# Equipment Tracker — Backend

## Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Scripts

```bash
npm install       # Install dependencies
npm run dev       # Start development server with nodemon (port 5000)
npm start         # Start production server
```

## Health Check

```
GET http://localhost:5000/api/health
```

## Project Structure

```
src/
├── config/
│   └── db.js              # PostgreSQL Pool singleton
├── db/
│   ├── schema.sql         # Table definitions (Phase 2)
│   └── seed.sql           # Category seed data (Phase 2)
├── middleware/
│   ├── errorHandler.js    # Global Express error handler
│   └── notFound.js        # 404 route fallback
├── routes/                # API route modules (Phase 3+)
└── index.js               # Express entry point
```
