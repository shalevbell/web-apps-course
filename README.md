# Netflix Clone - Web Apps Course

## Installation

```bash
npm install
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

The server will start on `http://localhost:3000`

## Usage

Open your browser and navigate to:

- **Login Page**: <http://localhost:3000/login.html>
- **Register**: <http://localhost:3000/register.html>

After logging in, you can create profiles and browse content.
