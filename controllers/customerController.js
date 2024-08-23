const Application = require('../models/MutationApplication');
const { Customer } = require('../models'); // Correctly import the Customer model
const Meter = require('../models/Meter');
const User = require('../models/User');

exports.applyForMutation = async (req, res) => {
  const { meterId, documents } = req.body;

  try {
    const meter = await Meter.findByPk(meterId);
    if (!meter) return res.status(400).send('Meter not found');

    const newApplication = await Application.create({
      userId: req.user.id,
      meterId,
      documents
    });

    res.json({ application: newApplication });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.trackApplicationStatus = async (req, res) => {
  try {
    const applications = await Application.findAll({ where: { userId: req.user.id } });
    res.json({ applications });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.submitClaim = async (req, res) => {
  const { applicationId, issueDetails, documents } = req.body;

  try {
    const application = await Application.findByPk(applicationId);
    if (!application) return res.status(400).send('Application not found');

    // Assuming there is a Claim model and a relationship with Application
    const newClaim = await Claim.create({
      applicationId,
      issueDetails,
      documents
    });

    res.json({ claim: newClaim });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.viewMeterOnMap = async (req, res) => {
  try {
    const meters = await Meter.findAll();
    res.json({ meters });
  } catch (err) {
    res.status(400).send(err.message);
  }
};
exports.getCustomerByNationalId = async (req, res) => {
  const { nationalId } = req.params;

  try {
    console.log('Fetching customer data for National ID:', nationalId);
    const customer = await Customer.findOne({ where: { nationalId } });

    if (!customer) {
      console.log('Customer not found for National ID:', nationalId);
      return res.status(404).send('Customer not found');
    }

    console.log('Customer data retrieved:', customer);
    res.status(200).json(customer);
  } catch (err) {
    console.error('Error fetching customer data:', err);
    res.status(500).send(err.message);
  }
};