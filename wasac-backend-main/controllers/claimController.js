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
        from: 'your-email@gmail.com',
        to: claim.userEmail,
        subject: 'Your Claim has been Answered',
        text: `Your claim question: "${claim.question}" has been answered.\n\nAnswer: ${answer}`,
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
