const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize('aquatrack', 'root', 'Admin@123',{
  host: 'localhost',
  dialect: 'mysql', // or 'postgres', 'sqlite', 'mariadb', etc.
  logging: false, // Disable logging or provide a custom function
});

module.exports = sequelize;
