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
    const { firstName, lastName, phoneNumber, nationalId } = req.user;
    const meterNumber = req.body.meterNumber;

    // Ensure meterNumber is a valid, single string
    if (typeof meterNumber !== 'string' || meterNumber.trim().includes(',')) {
      return res.status(400).json({ error: 'Meter number must be a single valid string value' });
    }
    if (!nationalId) {
      return res.status(400).json({ error: 'National ID is required' });
    }
    
    // Check if there is an existing application for this meter number that is not approved or rejected
    const existingApplication = await MutationApplication.findOne({
      where: {
        meterNumber: meterNumber.trim(),
        status: {
          [db.Sequelize.Op.notIn]: ['Approved', 'Rejected']
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        error: `An application for meter number ${meterNumber.trim()} is already in progress and not yet approved or rejected.`
      });
    }

    const files = req.files;

    // Ensure all required files are provided
    if (!files || !files.identityProof || !files.newPropertyProof || !files.oldPropertyProof || !files.applicationLetter || !files.utilityBillProof) {
      return res.status(400).json({ error: 'All required documents must be uploaded' });
    }

    console.log('National ID:', nationalId);

    const newApplication = await MutationApplication.create({
      firstName,
      lastName,
      phoneNumber,
      nationalId,  // Ensure this is included
      meterNumber: meterNumber.trim(),
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
      const user = await User.findOne({ where: { phoneNumber: application.phoneNumber } });
      
      if (!user) {
        console.error('User not found with phone number:', application.phoneNumber);
        return res.status(404).json({ error: 'User not found' });
      }
      
      application.status = status;
      await application.save();
      
      console.log('Application status updated successfully:', application);
      
      const mailOptions = {
        from: 'ndekezibenjamin2@gmail.com',
        to: user.email,
        subject: `Your Application Status has been updated to ${status}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                  <img src="cid:logo" alt="WasacGroup Logo" style="max-width: 200px; height: auto;">
                </td>
              </tr>
            </table>
            <table role="presentation" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px;">
                  <h1 style="color: #4C91CA; margin-bottom: 20px;">Application Status Update</h1>
                  <p style="font-size: 16px;">Dear ${user.firstName},</p>
                  <p style="font-size: 16px;">We hope this email finds you well. We are writing to inform you about an important update regarding your application.</p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f8f8f8; border-radius: 4px;">
                    <tr>
                      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Application ID:</strong>
                      </td>
                      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        ${application.id}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px;">
                        <strong>New Status:</strong>
                      </td>
                      <td style="padding: 15px; color: #4C91CA; font-weight: bold;">
                        ${status}
                      </td>
                    </tr>
                  </table>
                  <p style="font-size: 16px;">If you have any questions or need further clarification regarding this update, please don't hesitate to contact our support team. We're here to assist you.</p>
                  <p style="font-size: 16px;">Thank you for choosing WasacGroup. We appreciate your trust in our services.</p>
                  <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The WasacGroup Support Team</p>
                </td>
              </tr>
            </table>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #4C91CA; color: #ffffff;">
                  <p style="margin: 0; font-size: 14px;">&copy; 2024 WasacGroup. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        attachments: [{
          filename: 'Wasaclogo.png',
          path: 'controllers/WasacGroupLogo1.png',
          cid: 'logo'
        }]
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