# Netflix Clone - Web Apps Course

A full-stack Netflix-inspired streaming platform built with vanilla JavaScript, Express.js, and MongoDB. Features user authentication, profile management, content browsing with filters, video playback with resume functionality, and OMDB API integration for real-time ratings.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Functionality](#functionality)

## Features

- **User Authentication** - Register, login, session management
- **Multi-Profile Support** - Up to 5 profiles per user (Netflix-style)
- **Content Browsing** - Filter by genre, type, watched status with pagination
- **Video Player** - HTML5 player with resume/continue watching functionality
- **Like System** - Like content and see global like counts
- **Personalized Recommendations** - Based on viewing history and likes
- **OMDB Integration** - Fetch real-time OMDB Metascore ratings
- **Search & Filters** - Advanced filtering and sorting options
- **Admin Panel** - Upload and manage content (images & videos)
- **Responsive Design** - Works on desktop, tablet, and mobile

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Docker & Docker Compose (for MongoDB)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-apps-course
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB using Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Verify MongoDB is running**
   ```bash
   docker-compose ps
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser to `https://localhost:3000/login.html`
   - Accept the self-signed certificate warning

## Environment Variables

The server reads its configuration from environment variables. Set them before starting the app:

### Required Variables
- `SESSION_SECRET` – Long random string for signing session cookies (auto-generated if not provided)

### Optional Variables
- `MONGODB_URI` – MongoDB connection string (default: `mongodb://localhost:27017/netflix-clone`)
- `PORT` – Server port (default: `3000`)
- `NODE_ENV` – Runtime mode: `development` or `production` (default: `production`)
- `ADMIN_EMAIL` – Email address that receives admin privileges on registration
- `SESSION_COOKIE_SECURE` – Override session cookie Secure flag: `true` / `false` (default: `true` in production)
- `SSL_DAYS_VALID` – Days the auto-generated SSL certificate remains valid (default: `365`)
- `ITEMS_PER_PAGE` – Number of items per page in genre/filter views (default: `12`)
- `OMDB_API_KEY` – OMDB API key for fetching movie/series ratings (optional but recommended)

### Setting Environment Variables

**macOS / Linux (bash, zsh, etc.)**
```bash
export OMDB_API_KEY='your-api-key'
export ITEMS_PER_PAGE=20
export ADMIN_EMAIL='admin@example.com'
npm start
```

**Windows PowerShell**
```powershell
$env:OMDB_API_KEY = 'your-api-key'
$env:ITEMS_PER_PAGE = '20'
$env:ADMIN_EMAIL = 'admin@example.com'
npm start
```

**Windows Command Prompt**
```cmd
set OMDB_API_KEY=your-api-key
set ITEMS_PER_PAGE=20
set ADMIN_EMAIL=admin@example.com
npm start
```

## Running the Project

### 1. Start MongoDB
```bash
# Start MongoDB in the background
docker-compose up -d

# Verify MongoDB is running
docker-compose ps

# View MongoDB logs (optional)
docker-compose logs -f mongodb
```

MongoDB will be accessible at `localhost:27017` with database name `netflix-clone`.

### 2. Start the Application
```bash
# Basic start
npm start

# With environment variables (recommended)
export OMDB_API_KEY='your-key' && npm start
```

The server runs on HTTPS with an auto-generated self-signed certificate.
**First-time visits will show a browser security warning** - click "Advanced" and proceed to trust the certificate (development only).

### 3. Access the Application
- **Main Page**: <https://localhost:3000>
- **Login**: <https://localhost:3000/login.html>
- **Register**: <https://localhost:3000/register.html>

### Stopping the Application
```bash
# Stop the server: Ctrl+C

# Stop MongoDB (keeps data)
docker-compose down

# Stop MongoDB and delete all data
docker-compose down -v
```

## Project Structure

```
web-apps-course/
├── server.js                      # Main Express server entry point
├── package.json                   # Dependencies and scripts
├── docker-compose.yml             # MongoDB container configuration
│
├── public/                        # Frontend static files
│   ├── *.html                     # HTML pages (login, register, feed, etc.)
│   ├── css/                       # Stylesheets
│   ├── js/                        # Client-side JavaScript
│   │   ├── auth.js               # Authentication logic
│   │   ├── feed.js               # Main feed page
│   │   ├── genre.js              # Genre filtering page
│   │   ├── player.js             # Video player
│   │   └── content-details.js    # Content details page
│   ├── _images/                   # Static images & uploaded content images
│   └── _videos/                   # Uploaded video files
│
├── src/                           # Backend source code
│   ├── controllers/               # Request handlers (business logic)
│   │   ├── authController.js     # User authentication
│   │   ├── profileController.js  # Profile management & likes
│   │   ├── contentController.js  # Content browsing & filtering
│   │   ├── viewingHistoryController.js  # Watch progress tracking
│   │   ├── adminController.js    # Admin content management
│   │   └── omdbController.js     # OMDB API integration
│   │
│   ├── models/                    # MongoDB schemas (Mongoose)
│   │   ├── User.js               # User accounts
│   │   ├── Profile.js            # User profiles (Netflix-style)
│   │   ├── Content.js            # Movies/series metadata
│   │   └── ViewingHistory.js     # Watch progress & completion
│   │
│   ├── routes/                    # API route definitions
│   │   └── index.js              # Main router with all endpoints
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.js               # Authentication & authorization
│   │   └── validateRequest.js    # Input validation
│   │
│   ├── services/                  # Business logic & external APIs
│   │   └── omdbService.js        # OMDB API client
│   │
│   ├── utils/                     # Utility functions
│   │   ├── responses.js          # Standard API response helpers
│   │   ├── seedContent.js        # Database seeding
│   │   └── logger.js             # Winston logger configuration
│   │
│   └── data/                      # Static data files
│       └── content.json           # Seed data for movies/series
│
└── logs/                          # Application logs (auto-generated)
    ├── app.log                    # All logs
    └── error.log                  # Error logs only
```

## Functionality

### Core Features

#### 1. **Authentication & Authorization**
- User registration with email validation
- Secure login with bcrypt password hashing
- Session-based authentication using Express sessions
- Role-based access control (admin vs regular users)
- **Files**: `authController.js`, `auth.js` (middleware)

#### 2. **Profile Management**
- Create up to 5 profiles per user (Netflix-style)
- Each profile has independent watch history and likes
- Profile avatars (4 preset options)
- **Files**: `profileController.js`, `Profile.js`

#### 3. **Content Browsing**
- **Feed Page**: Categorized sections (Popular, Recommended, Continue Watching, By Genre)
- **Genre Page**: Advanced filtering by genre, type, watched status
- **Sorting**: Name (A-Z/Z-A), Year, Rating
- **Pagination**: Configurable via `ITEMS_PER_PAGE` env var
- **Files**: `feed.js`, `genre.js`, `contentController.js`

#### 4. **Video Player**
- HTML5 video player with full controls
- **Resume Functionality**: Automatically resumes from last watched position
- **Continue Watching**: Shows content with viewing progress
- Auto-save progress every 10 seconds
- Keyboard shortcuts (Space, Arrow keys, F for fullscreen)
- **Files**: `player.js`, `viewingHistoryController.js`

#### 5. **Like System**
- Like/unlike content per profile
- Global like counts displayed on content cards
- Filter content by liked status
- **Files**: `profileController.js`, `Profile.js`

#### 6. **Personalized Recommendations**
- Based on viewing history and liked content
- Genre and type preferences analysis
- Falls back to popular content for new users
- **Files**: `contentController.js` (`getPersonalizedRecommendations`)

#### 7. **OMDB Integration** ⭐
- Fetches real-time ratings from OMDB API
- **Displayed ratings**:
  - IMDB Rating (e.g., 8.8/10)
  - Rotten Tomatoes (e.g., 87%)
  - Metascore (e.g., 74/100)
- Automatic rating fetch on server startup
- Ratings displayed on genre and content-details pages
- **Setup**: Set `OMDB_API_KEY` environment variable
- **Files**: `omdbService.js`, `omdbController.js`, `seedContent.js`

#### 8. **Admin Panel**
- Upload content images and videos
- Create new content entries
- Delete content
- Access restricted to admin users (set via `ADMIN_EMAIL`)
- **Files**: `adminController.js`, `admin.html`

### Environment Variable Effects

| Variable | Effect | Default |
|----------|--------|---------|
| `ITEMS_PER_PAGE` | Number of content items per page in genre/filter views | `12` |
| `OMDB_API_KEY` | Enables OMDB rating fetching. Ratings appear on genre and content-details pages | Not set (ratings disabled) |
| `ADMIN_EMAIL` | Email address that receives admin privileges upon registration | None |
| `PORT` | Changes the server port | `3000` |
| `MONGODB_URI` | Custom MongoDB connection string for production | `mongodb://localhost:27017/netflix-clone` |

### Logs
Application logs are written to:
- `logs/app.log` - All logs
- `logs/error.log` - Errors only
