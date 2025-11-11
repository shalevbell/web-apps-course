# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Netflix Clone - A full-stack web application built for a web development course. Features user authentication, profile management, content browsing, and viewing history tracking with a Netflix-style interface.

## Technology Stack

**Backend:**
- Node.js with Express.js framework
- MongoDB with Mongoose ODM
- Express Session with MongoDB session store
- Self-signed SSL for HTTPS-only operation
- Winston logging, bcrypt password hashing

**Frontend:**
- Vanilla JavaScript with client-side rendering
- HTML5 and CSS3 with responsive design
- Static assets served from Express

## Development Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Start MongoDB using Docker
docker-compose up -d

# Verify MongoDB is running
docker-compose ps
```

### Environment Configuration
The application requires these environment variables:

- `SESSION_SECRET` - Required: Random string for session signing
- `MONGODB_URI` - Defaults to `mongodb://localhost:27017/netflix-clone`
- `NODE_ENV` - Defaults to `production`
- `ADMIN_EMAIL` - Optional: Email for admin privileges
- `SESSION_COOKIE_SECURE` - Optional: Override session cookie security
- `SSL_DAYS_VALID` - Optional: Self-signed certificate validity (default: 365)

### Running the Application
```bash
# Start the server (HTTPS only)
npm start

# Development mode (same as start)
npm run dev
```

Access at `https://localhost:3000` (browser security warning expected for self-signed cert)

## Architecture

### MVC Structure
- **Models** (`src/models/`): User, Profile, Content, ViewingHistory
- **Controllers** (`src/controllers/`): authController, profileController, viewingHistoryController
- **Routes** (`src/routes/index.js`): API endpoints with validation middleware
- **Views** (`public/`): Static HTML pages with vanilla JavaScript

### Key Components

**Authentication System:**
- Session-based authentication with MongoDB store
- Password hashing with bcrypt
- Middleware for protected routes (`src/middleware/auth.js`)
- Request validation using express-validator

**Database Models:**
- User model with email/username authentication
- Profile model supporting multiple profiles per user
- Content model for movies/shows with seeded data
- ViewingHistory model tracking watch progress and completion

**Frontend Architecture:**
- Static file serving from `public/` directory
- Page-specific JavaScript files in `public/js/`
- CSS organized by page in `public/css/`
- Image assets in `public/_images/`

### API Endpoints Structure
- `/api/health` - Health check
- `/api/auth/*` - Authentication (register, login, logout, current user)
- `/api/users/:userId/profiles` - Profile management
- `/api/profiles/:profileId/*` - Profile-specific actions (likes, viewing history)
- `/api/content` - Content data fetching

## Database Operations

### MongoDB Management
```bash
# Start database
docker-compose up -d

# Stop database (preserves data)
docker-compose down

# Stop and delete all data
docker-compose down -v

# View database logs
docker-compose logs -f mongodb
```

### Content Seeding
Content is automatically seeded from `src/utils/seedContent.js` on server startup when database is connected.

## Security Features

- HTTPS-only operation with auto-generated self-signed certificates
- Secure session management with httpOnly cookies
- Password hashing with bcrypt
- Input validation and sanitization
- CSRF protection through session management
- Admin role system via ADMIN_EMAIL environment variable

## Development Workflow

### Server Management
- Server automatically restarts required for code changes
- MongoDB runs independently via Docker Compose
- Logs available via Winston logger and console output
- Self-signed SSL certificates regenerated on each restart

### Debugging
- Request logging middleware logs all incoming requests
- Winston logger writes to console and can be configured for file output
- Error handling middleware provides structured error responses
- Database connection status logged on startup

## File Structure Key Points

- `server.js` - Main application entry point with HTTPS setup
- `src/config/db.js` - MongoDB connection configuration
- `src/routes/index.js` - Centralized API route definitions
- `src/middleware/` - Authentication and validation middleware
- `public/` - All client-side assets (HTML, CSS, JS, images)
- `docker-compose.yml` - MongoDB container configuration

## Common Development Tasks

### Adding New API Endpoints
1. Add route definition in `src/routes/index.js`
2. Create controller function in appropriate controller file
3. Add validation middleware if needed
4. Update frontend JavaScript to consume new endpoint

### Database Schema Changes
1. Modify model files in `src/models/`
2. Update seeding logic in `src/utils/seedContent.js` if needed
3. No formal migration system - database recreated via Docker volume management

### Frontend Page Development
1. Add HTML file to `public/`
2. Create corresponding CSS file in `public/css/`
3. Add JavaScript functionality in `public/js/`
4. Static assets served automatically by Express