# Netflix Clone - Web Apps Course

## Installation

```bash
npm install
```

## Environment Variables

The server reads its configuration from the following variables:

- `SESSION_SECRET` – long, random string used to sign session cookies (required)
- `MONGODB_URI` – MongoDB connection string (defaults to `mongodb://localhost:27017/netflix-clone`)
- `NODE_ENV` – runtime mode (defaults to `production` automatically)
- `ADMIN_EMAIL` – optional email address that should receive admin privileges
- `SESSION_COOKIE_SECURE` – optional override for the session cookie `Secure` flag (`true` / `false`). Defaults to `true` when `NODE_ENV=production`, otherwise `false`.
- `SSL_DAYS_VALID` – optional number of days the auto-generated self-signed certificate remains valid (default: 365)

Set them before starting the app:

### macOS / Linux (bash, zsh, etc.)
```bash
SESSION_SECRET='replace-with-random-string' \
MONGODB_URI='mongodb://user:pass@host:27017/prod-db?authSource=admin' \
NODE_ENV=production \
ADMIN_EMAIL='admin@example.com' \
npm run start
```

### Windows PowerShell
```powershell
$env:SESSION_SECRET         = 'replace-with-random-string'
$env:MONGODB_URI            = 'mongodb://user:pass@host:27017/prod-db?authSource=admin'
$env:NODE_ENV               = 'production'
$env:ADMIN_EMAIL            = 'admin@example.com'
npm run start
```

### Windows Command Prompt
```cmd
set SESSION_SECRET=replace-with-random-string
set MONGODB_URI=mongodb://user:pass@host:27017/prod-db?authSource=admin
set NODE_ENV=production
set ADMIN_EMAIL=admin@example.com
npm run start
```

### Docker / Docker Compose
```yaml
services:
  web:
    image: your-image
    environment:
      - SESSION_SECRET=replace-with-random-string
      - MONGODB_URI=mongodb://user:pass@host:27017/prod-db?authSource=admin
      - NODE_ENV=production
      - ADMIN_EMAIL=admin@example.com
      - SESSION_COOKIE_SECURE=true
```

## Starting MongoDB

The application requires MongoDB to be running. Use Docker Compose to start MongoDB locally:

```bash
# Start MongoDB in the background
docker-compose up -d

# Verify MongoDB is running
docker-compose ps

# View MongoDB logs (optional)
docker-compose logs -f mongodb
```

MongoDB will be accessible at `localhost:27017` with the database name `netflix-clone`.

### Stopping MongoDB

```bash
# Stop MongoDB (keeps data)
docker-compose down

# Stop MongoDB and delete all data
docker-compose down -v
```

## Running the Server

Once MongoDB is running, start the Node.js application:

```bash
npm start
```

The server runs exclusively over HTTPS using an auto-generated self-signed certificate.
First-time visits will show a browser warning; proceed to trust the certificate.

Access the app at `https://localhost:3000`

## Usage

Open your browser and navigate to:

- **Login Page**: <https://localhost:3000/login.html>
- **Register**: <https://localhost:3000/register.html>

After logging in, you can create profiles and browse content.
