require('dotenv').config();
const app = require('./src/app');
const { fixDatabaseSchema } = require('./src/utils/databaseFix');
const PORT = process.env.PORT || 3000;

// Fix database schema on startup
fixDatabaseSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to fix database schema:', error);
  // Still start the server even if database fix fails
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});