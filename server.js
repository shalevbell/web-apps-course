const express = require('express');
const path = require('path');
const app = express();

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Logs all incoming requests with timestamp
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`Web Apps Course Netflix Clone Server`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}/login.html`);
  console.log('='.repeat(50));
});
