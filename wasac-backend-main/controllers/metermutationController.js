// controllers/mutationApplicationController.js
const db = require('../models');
const { User } = require('../models');  // Adjust the path as needed
const MutationApplication = db.MutationApplication;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ndekezibenjamin2@gmail.com', // Replace with your actual email
    pass: 'iqpf vqpz vrgr dzfr',        // Replace with your actual password
  },
});

exports.createApplication = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.user;
    const meterNumber = req.body.meterNumber;

    // Ensure meterNumber is a valid, single string
    if (typeof meterNumber !== 'string' || meterNumber.trim().includes(',')) {
      return res.status(400).json({ error: 'Meter number must be a single valid string value' });
    }

    // Check if there is an existing application for this meter number that is not approved
    const existingApplication = await MutationApplication.findOne({
      where: {
        meterNumber: meterNumber.trim(),
        status: {
          [db.Sequelize.Op.not]: 'Approved',
          [db.Sequelize.Op.not]: 'Rejected'  
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        error: `An application for meter number ${meterNumber.trim()} is already in progress and not yet approved or rejected.`
      });
    }

    const files = req.files;

    const newApplication = await MutationApplication.create({
      firstName,
      lastName,
      phoneNumber,
      meterNumber: meterNumber.trim(),  // Ensure it's saved without any spaces or commas
      identityProof: files.identityProof[0].buffer,
      newPropertyProof: files.newPropertyProof[0].buffer,
      oldPropertyProof: files.oldPropertyProof[0].buffer,
      applicationLetter: files.applicationLetter[0].buffer,
      utilityBillProof: files.utilityBillProof[0].buffer,
      status: 'Submitted',
    });

    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: `Error uploading files: ${error.message}` });
  }
};


exports.getApplicationFile = async (req, res) => {
  try {
    const application = await MutationApplication.findByPk(req.params.id);
    if (!application) {
      return res.status(404).send('Application not found');
    }

    const fileType = req.params.fileType; // identityProof, newPropertyProof, etc.
    const fileBuffer = application[fileType];

    if (!fileBuffer) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error fetching application file:', error);
    res.status(500).send('Error fetching application file');
  }
};


exports.getAllApplications = async (req, res) => {
  try {
    const applications = await MutationApplication.findAll();
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Error fetching applications' });
  }
};
  // Get a single mutation application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const application = await MutationApplication.findByPk(req.params.id);
    if (application) {
      res.status(200).json(application);
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Error fetching application' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const files = req.files;
    const application = await MutationApplication.findByPk(req.params.id);

    if (application) {
      application.meterNumber = req.body.meterNumber || application.meterNumber;
      application.identityProof = files.identityProof ? files.identityProof[0].buffer : application.identityProof;
      application.newPropertyProof = files.newPropertyProof ? files.newPropertyProof[0].buffer : application.newPropertyProof;
      application.oldPropertyProof = files.oldPropertyProof ? files.oldPropertyProof[0].buffer : application.oldPropertyProof;
      application.applicationLetter = files.applicationLetter ? files.applicationLetter[0].buffer : application.applicationLetter;
      application.utilityBillProof = files.utilityBillProof ? files.utilityBillProof[0].buffer : application.utilityBillProof;

      await application.save();
      res.status(200).send('Application updated successfully');
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).send('Error updating application');
  }
};

// Delete a mutation application by ID
exports.deleteApplication = async (req, res) => {
  try {
    const application = await MutationApplication.findByPk(req.params.id);

    if (application) {
      await application.destroy();
      res.status(200).send('Application deleted successfully');
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Error deleting application' });
  }
};
// controllers/mutationApplicationController.js
exports.getApplicationsByPhoneNumber = async (req, res) => {
  try {
    const phoneNumber = req.user.phoneNumber;
    console.log('Fetching applications for phone number:', phoneNumber);
    const applications = await MutationApplication.findAll({ where: { phoneNumber } });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ error: 'Error fetching user applications' });
  }
};
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await MutationApplication.findByPk(req.params.id);

    if (application) {
      // Retrieve the user's email using their phone number
      const user = await User.findOne({ where: { phoneNumber: application.phoneNumber } });

      if (!user) {
        console.error('User not found with phone number:', application.phoneNumber);
        return res.status(404).json({ error: 'User not found' });
      }

      application.status = status;
      await application.save();

      console.log('Application status updated successfully:', application);

      // Send email notification to the customer
      const mailOptions = {
        from: 'your-email@gmail.com', // Replace with your actual email
        to: user.email,               // The user's email
        subject: `Your Application Status has been updated to ${status}`,
        text: `Dear ${user.firstName},\n\nYour application with ID ${application.id} has been updated to "${status}".\n\nThank you.`,
      };

      console.log('Sending email to:', user.email);
      console.log('Email options:', mailOptions);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ error: 'Error sending email', details: error.toString() });
        } else {
          console.log('Email sent successfully:', info.response);
          res.status(200).send('Application status updated successfully and email sent');
        }
      });

    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).send('Error updating application status');
  }
};