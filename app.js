const express = require('express');
const cors = require('cors'); 
const app = express();
const { sequelize } = require('./models'); 

app.use(cors()); 
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
app.use('/api/applications', mutationApplicationRoutes);
app.use('/api/claims', ClaimRoutes);
app.use('/api/reports', reportRoutes); 

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
