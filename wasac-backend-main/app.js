const express = require('express');
const cors = require('cors'); // Import the cors package
const app = express();
const { sequelize } = require('./models'); // Import sequelize instance

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const meterRoutes = require('./routes/meterRoutes');
const mutationApplicationRoutes = require('./routes/mutationRoutes');
const ClaimRoutes = require('./routes/claimRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/applications', mutationApplicationRoutes)
app.use('/api/claims', ClaimRoutes)
app.use('/api/reports', reportRoutes); // Add this line




const PORT = 5000;

// Automatically sync database schema to match the models
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Unable to connect to the database:', error);
});
