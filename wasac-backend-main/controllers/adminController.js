const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const Meter = require('../models/Meter');
const Application = require('../models/MutationApplication');
const User = require('../models/User');
const Claim = require('../models/Claim');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wasacaquatrack@gmail.com',
    pass: 'qbpr zqby xril itgb',
  },
});

exports.addMeter = async (req, res) => {
  const { meterNumber, ownerName, latitude, longitude } = req.body;

  try {
    const newMeter = await Meter.create({
      meterNumber,
      ownerName,
      latitude,
      longitude
    });

    res.json({ meter: newMeter });
  } catch (err) {
    console.error('Error in addMeter:', err);
    res.status(400).send(err.message);
  }
};

exports.viewAndManageApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({ include: [User, Meter] });
    res.json({ applications });
  } catch (err) {
    console.error('Error in viewAndManageApplications:', err);
    res.status(400).send(err.message);
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { applicationId, status } = req.body;

  try {
    console.log(`Received request to update application ID: ${applicationId} with status: ${status}`);

    const application = await Application.findByPk(applicationId, { include: [User] });
    if (!application) {
      console.error('Application not found:', applicationId);
      return res.status(400).send('Application not found');
    }

    console.log('Application found:', application);

    application.status = status;
    await application.save();

    console.log('Application status updated successfully:', application);

    // Send email notification to the customer
    const mailOptions = {
      from: 'ndekezibenjamin2@gmail.com', // Replace with your actual email
      to: application.User.email,   // The customer's email
      subject: `Your Application Status has been updated to ${status}`,
      text: `Dear ${application.User.firstName},\n\nYour application with ID ${applicationId} has been updated to "${status}".\n\nThank you.`,
    };

    console.log('Sending email to:', application.User.email);
    console.log('Email options:', mailOptions);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email', details: error.toString() });
      } else {
        console.log('Email sent successfully:', info.response);
        res.json({ application });
      }
    });

  } catch (err) {
    console.error('Error in updateApplicationStatus:', err);
    res.status(500).json({ error: 'Error updating application status', details: err.toString() });
  }
};
exports.respondToClaim = async (req, res) => {
  const { claimId, response } = req.body;

  try {
    const claim = await Claim.findByPk(claimId);
    if (!claim) {
      console.error('Claim not found:', claimId);
      return res.status(400).send('Claim not found');
    }

    claim.response = response;
    await claim.save();

    res.json({ claim });
  } catch (err) {
    console.error('Error in respondToClaim:', err);
    res.status(400).send(err.message);
  }
};

exports.viewMetersOnMap = async (req, res) => {
  try {
    const meters = await Meter.findAll();
    res.json({ meters });
  } catch (err) {
    console.error('Error in viewMetersOnMap:', err);
    res.status(400).send(err.message);
  }
};

exports.generateReports = async (req, res) => {
  try {
    const report = await Application.findAll({
      attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
      group: ['status']
    });

    res.json({ report });
  } catch (err) {
    console.error('Error in generateReports:', err);
    res.status(400).send(err.message);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await sequelize.query('SELECT * FROM Users', {
      type: sequelize.QueryTypes.SELECT
    });
    res.json(users);
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).send(err.message);
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await sequelize.query('SELECT * FROM Users WHERE nationalId = :id', {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });
    if (user.length === 0) {
      console.error('User not found:', id);
      return res.status(404).send('User not found');
    }
    res.json(user[0]);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).send(err.message);
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  const { username, email, password, role, firstName, lastName, province, district, cell, village, gender, dateOfBirth, phoneNumber, nationalId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await sequelize.query(
      `INSERT INTO Users (username, email, password, role, firstName, lastName, province, district, cell, village, gender, dateOfBirth, phoneNumber, nationalId)
       VALUES (:username, :email, :password, :role, :firstName, :lastName, :province, :district, :cell, :village, :gender, :dateOfBirth, :phoneNumber, :nationalId)`,
      {
        replacements: { username, email, password: hashedPassword, role, firstName, lastName, province, district, cell, village, gender, dateOfBirth, phoneNumber, nationalId },
        type: sequelize.QueryTypes.INSERT
      }
    );
    res.status(201).json({ id: user[0], ...req.body });
  } catch (err) {
    console.error('Error in createUser:', err);
    res.status(500).send(err.message);
  }
};

// Update a user
// Update a user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role, firstName, lastName, province, district, cell, village, gender, dateOfBirth, phoneNumber, nationalId } = req.body;

  try {
    const result = await sequelize.query(
      `UPDATE Users SET username = :username, email = :email, role = :role, firstName = :firstName, lastName = :lastName, province = :province, district = :district, cell = :cell, village = :village, gender = :gender, dateOfBirth = :dateOfBirth, phoneNumber = :phoneNumber, nationalId = :nationalId
       WHERE id = :id`,
      {
        replacements: { username, email, role, firstName, lastName, province, district, cell, village, gender, dateOfBirth, phoneNumber, nationalId, id },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('Update result:', result); // Add this line to inspect the result

    // Assuming result[1] is the number of affected rows in some dialects
    if (result.affectedRows === 0 || result[1] === 0) {
      console.error('User not found:', id);
      return res.status(404).send('User not found');
    }

    res.json({ id, ...req.body });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).send(err.message);
  }
};


// Delete a user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await sequelize.query(
      'DELETE FROM Users WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.DELETE
      }
    );

    if (result[0].affectedRows === 0) {
      console.error('User not found:', id);
      return res.status(404).send('User not found');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).send(err.message);
  }
};
exports.getDashboardData = async (req, res) => {
  try {
    const userCount = await sequelize.query('SELECT COUNT(*) AS count FROM Users', {
      type: sequelize.QueryTypes.SELECT
    });

    const applicationCount = await sequelize.query('SELECT COUNT(*) AS count FROM MutationApplications', {
      type: sequelize.QueryTypes.SELECT
    });

    const claimCount = await sequelize.query('SELECT COUNT(*) AS count FROM Claims', {
      type: sequelize.QueryTypes.SELECT
    });

    const meterCount = await sequelize.query('SELECT COUNT(*) AS count FROM Meters', {
      type: sequelize.QueryTypes.SELECT
    });

    const applicationStatus = await sequelize.query(
      'SELECT status, COUNT(*) AS count FROM MutationApplications GROUP BY status',
      { type: sequelize.QueryTypes.SELECT }
    );

    const applicationsByDay = await sequelize.query(
      `SELECT 
        DATE(createdAt) as date, 
        COUNT(*) as count 
      FROM MutationApplications 
      GROUP BY date 
      ORDER BY date`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const claimStatus = await sequelize.query(
      'SELECT status, COUNT(*) AS count FROM Claims GROUP BY status',
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      userCount: userCount[0].count,
      applicationCount: applicationCount[0].count,
      claimCount: claimCount[0].count,
      meterCount: meterCount[0].count,
      applicationStatus,
      applicationsByDay,
      claimStatus,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
};

exports.getApplicationsByMonth = async (req, res) => {
  try {
    const applications = await sequelize.query(
      `SELECT 
        MONTHNAME(createdAt) as month, 
        COUNT(*) as count 
      FROM MutationApplications 
      GROUP BY MONTH(createdAt) 
      ORDER BY MONTH(createdAt)`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications by month:', error);
    res.status(500).json({ error: 'Error fetching applications by month' });
  }
};