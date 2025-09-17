# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Netflix Clone web application built as a static frontend using pure HTML, CSS, and JavaScript with Bootstrap 5. The application simulates a Netflix-like streaming interface with authentication, user profiles, content browsing, and search functionality.

## Architecture

### Frontend Structure
- **HTML Pages**: Three main pages handling different app states
  - `login.html` - User authentication page
  - `profiles.html` - Profile selection interface ("Who's watching?")
  - `feed.html` - Main content browsing interface with hero section and categorized content
- **CSS Styling**: Bootstrap 5 + custom CSS for Netflix-like appearance
  - `css/login.css` - Login page styling
  - `css/profiles.css` - Profile selection page styling
  - `css/feed.css` - Main feed styling with Netflix branding
- **JavaScript Modules**: Client-side logic with clear separation of concerns
  - `js/auth.js` - Authentication state management and routing
  - `js/login.js` - Login form handling and validation
  - `js/profiles.js` - Profile selection and management
  - `js/feed.js` - Content rendering, search, filtering, and user interactions

### Data Management
- **Content Data**: Static JSON file containing movie/series metadata
  - `data/content.json` - Complete content catalog with titles, descriptions, genres, ratings
- **User State**: localStorage-based persistence
  - Authentication state (`isLoggedIn`, `userEmail`)
  - Profile selection (`selectedProfileId`, `selectedProfileName`)
  - User preferences (`contentLikes`, `likedContent` per profile)
  - Remember me functionality

### Asset Organization
- **Images**: Netflix branding and content assets
  - `_images/netflix_assets/` - Logo, favicon, background images
  - `_images/profile/` - User profile avatars (profile_pic_1.png, etc.)
  - `_images/posters/` - Movie and series poster images

## Key Features & Implementation

### Authentication Flow
1. **Login validation** in `js/login.js` with email/password requirements
2. **Auth state management** in `js/auth.js` with automatic redirects
3. **Profile selection** as intermediate step before accessing main content
4. **Logout functionality** with complete state cleanup

### Content Display System
- **Dynamic hero section** with random featured content and background images
- **Categorized browsing**: Trending (2020+), TV Shows, Movies with automatic filtering
- **Alphabetical sorting** toggle with persistent view state
- **Real-time search** with 300ms debouncing across title, genre, and description
- **Like system** with per-profile like counts and heart animation effects

### State Management Patterns
- Profile-scoped data storage using `profileId_contentId` keys
- Persistent view preferences (categorized vs alphabetical)
- Search state management with content visibility toggling
- Authentication state with automatic routing

## Development Workflow

### No Build Process Required
This is a static web application - simply open HTML files in a browser or serve via HTTP server.

### Local Development
```bash
# Serve files locally (any HTTP server)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Then open: http://localhost:8000/login.html
```

### File Structure
```
/
├── login.html          # Entry point - authentication
├── profiles.html       # Profile selection
├── feed.html          # Main application interface
├── css/               # Styling
├── js/                # Client-side logic
├── data/              # Static content data
└── _images/           # Asset files
```

### Testing Approach
- Manual browser testing across different screen sizes
- Test authentication flow: login → profile selection → feed
- Verify search functionality with various query types
- Test like/unlike interactions and persistence
- Check localStorage state management

### Content Management
- Add new content items to `data/content.json`
- Include poster images in `_images/posters/`
- Follow existing JSON schema: id, name, year, genre, type, description, image path
- Content automatically appears in appropriate categories based on type and year

## Development Patterns

### Event Handling
- DOM content loaded listeners for initialization
- Event delegation for dynamically generated content
- Click event separation (content vs like buttons)
- Debounced search input handling

### Data Flow
1. Load content from JSON → Store in `contentData` array
2. Filter/sort based on current view mode
3. Generate HTML using template functions
4. Attach event listeners to generated elements
5. Update localStorage for user interactions

### CSS Architecture
- Bootstrap 5 base classes for responsive layout
- Custom CSS for Netflix branding and specific component styling
- CSS animations for user interaction feedback (heart animations)
- Background image handling for hero sections