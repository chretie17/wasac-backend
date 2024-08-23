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
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="text-align: center; padding: 10px 0;">
              <img src="cid:logo" alt="Company Logo" style="max-width: 150px;">
            </div>
            <h2 style="color: #4C91CA;">Dear Customer,</h2>
            <p>Your claim has been reviewed, and we have provided a response.</p>
            <p><strong>Your question:</strong></p>
            <p style="font-style: italic; color: #555;">"${claim.question}"</p>
            <p><strong>Our answer:</strong></p>
            <p style="font-weight: bold; color: #000;">"${answer}"</p>
            <p>If you have any further questions, please feel free to reply to this email.</p>
            <p>Thank you for choosing our services.</p>
            <p style="color: #4C91CA; font-weight: bold;">Best regards,<br/>The Support Team</p>
            <div style="background-color: #4C91CA; color: #fff; text-align: center; padding: 10px; margin-top: 20px; border-radius: 5px;">
              <p style="margin: 0;">© 2024 Wasac Group. All rights reserved.</p>
            </div>
          </div>
        `,
        attachments: [{
          filename: 'Wasaclogo.png',
          path: 'controllers/WasacGroupLogo1.png',
          cid: 'logo' // same cid value as in the html img src
        }]
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      res.status(200).json(claim);
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
