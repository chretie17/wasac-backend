// controllers/claimController.js
const db = require('../models');
const Claim = db.Claim;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ndekezibenjamin2@gmail.com',
    pass: 'iqpf vqpz vrgr dzfr',
  },
});

exports.submitClaim = async (req, res) => {
  try {
    const { question } = req.body;
    const userEmail = req.user.email;

    const newClaim = await Claim.create({
      userEmail: userEmail,
      question: question,
      status: 'Pending',
    });

    res.status(200).json(newClaim);
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({ error: 'Error submitting claim' });
  }
};

exports.answerClaim = async (req, res) => {
  try {
    const { answer } = req.body;
    const claimId = req.params.id;

    const claim = await Claim.findByPk(claimId);

    if (claim) {
      claim.answer = answer;
      claim.status = 'Answered';
      await claim.save();

      const mailOptions = {
        from: 'ndekezibenjamin2@gmail.com',
        to: claim.userEmail,
        subject: 'Your Claim has been Answered',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Claim Response</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                  <img src="cid:logo" alt="Wasac Group Logo" style="max-width: 200px; height: auto;">
                </td>
              </tr>
            </table>
            <table role="presentation" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px;">
                  <h1 style="color: #4C91CA; margin-bottom: 20px;">Claim Response</h1>
                  <p style="font-size: 16px;">Dear Valued Customer,</p>
                  <p style="font-size: 16px;">We hope this email finds you well. We have reviewed your claim and are pleased to provide you with a response.</p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f8f8f8; border-radius: 4px;">
                    <tr>
                      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Your Question:</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; font-style: italic; color: #555;">
                        "${claim.question}"
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; border-top: 1px solid #e0e0e0;">
                        <strong>Our Answer:</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; color: #4C91CA; font-weight: bold;">
                        "${answer}"
                      </td>
                    </tr>
                  </table>
                  <p style="font-size: 16px;">We hope this information addresses your concerns. If you have any further questions or need additional clarification, please don't hesitate to reach out to us.</p>
                  <p style="font-size: 16px;">Thank you for your patience and for choosing Wasac Group. We value your trust in our services.</p>
                  <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The Wasac Group Support Team</p>
                </td>
              </tr>
            </table>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #4C91CA; color: #ffffff;">
                  <p style="margin: 0; font-size: 14px;">&copy; 2024 Wasac Group. All rights reserved.</p>
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

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ error: 'Error sending email', details: error.toString() });
        } else {
          console.log('Email sent:', info.response);
          res.status(200).json({ message: 'Claim answered successfully and email sent', claim });
        }
      });
    } else {
      res.status(404).json({ error: 'Claim not found' });
    }
  } catch (error) {
    console.error('Error answering claim:', error);
    res.status(500).json({ error: 'Error answering claim' });
  }
};
exports.getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.findAll({
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Error fetching claims' });
  }
};
