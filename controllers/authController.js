const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');
const { validationResult } = require('express-validator');
const { sequelize } = require('../models'); // Adjust the path according to your project structure

const SECRET_KEY = 'db4b9b4a9bfb56e1ee67e22bf0514a02e8062fca4e81182c6201822bd62e4e1f4324bcee62f8bd45b403dcd000bb0258475cf86fc92c2932594b246b2dbbd659';


exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  // Directly log the received request body to ensure correct structure
  console.log('Register request received:', req.body);

  // Ensure the nationalId is properly extracted from the request body
  const { nationalId, email, phoneNumber, password } = req.body;

  try {
    // Ensure the nationalId is a string
    if (typeof nationalId !== 'string') {
      console.log('Invalid national ID format:', typeof nationalId);
      return res.status(400).json({ errors: [{ msg: 'Invalid national ID format' }] });
    }

    // Retrieve customer data using national ID
    const customer = await Customer.findOne({ where: { nationalId } });
    if (!customer) {
      console.log('Customer not found with national ID:', nationalId);
      return res.status(404).send('Customer not found');
    }

    // Check if the phone number matches
    if (customer.phoneNumber.trim() !== phoneNumber.trim()) {
      console.log('Phone number mismatch:', phoneNumber, 'expected:', customer.phoneNumber);
      return res.status(400).send('Phone number does not match the one linked with the provided national ID');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user using customer data
    const user = await User.create({
      username: `${customer.firstName} ${customer.lastName}`,
      email,
      password: hashedPassword,
      role: 'customer',
      firstName: customer.firstName,
      lastName: customer.lastName,
      province: customer.province,
      district: customer.district,
      cell: customer.cell,
      village: customer.village,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      phoneNumber: customer.phoneNumber,
      nationalId: customer.nationalId,
    });

    console.log('User created successfully:', user);
    res.status(201).json(user);
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send(err.message);
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Email not found:', email);
      return res.status(400).send('Email not found');
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      console.log('Invalid password for email:', email);
      return res.status(400).send('Invalid password');
    }

    // Include nationalId in the JWT payload
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,  // Ensure nationalId is included
      },
      SECRET_KEY,
      { expiresIn: '1d' }
    );

    console.log('Login successful, token generated:', token);
    res.header('Authorization', token).send({ token, user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(400).send(err.message);
  }
};



exports.getCustomerByNationalId = async (req, res) => {
  const { nationalId } = req.params;

  try {
    const customer = await Customer.findOne({ where: { nationalId } });
    if (!customer) {
      return res.status(404).send('Customer not found');
    }
    res.json(customer);
  } catch (err) {
    res.status(500).send(err.message);
  }

};



exports.getUser = async (req, res) => {
  try {
    console.log('getUser: Received request to get user information'); // Log start

    if (!req.user || !req.user.id) {
      console.log('getUser: Invalid request. User information missing:', req.user); // Log missing user info
      return res.status(400).send('Invalid request. User information missing.');
    }

    console.log('getUser: User ID found:', req.user.id); // Log user ID

    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.log('getUser: User not found with ID:', req.user.id); // Log user not found
      return res.status(404).send('User not found');
    }

    console.log('getUser: User found:', user); // Log user details

    res.json({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      province: user.province,
      district: user.district,
      cell: user.cell,
      village: user.village,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      nationalId: user.nationalId,  // Include nationalId in the response
    });

    console.log('getUser: User information sent successfully'); // Log successful response
  } catch (err) {
    console.error('getUser: Error retrieving user:', err); // Log error details
    res.status(500).send('Internal Server Error');
  }
};
exports.getUserMeters = async (req, res) => {
  try {
    console.log('getUserMeters: Received request to get user meters'); // Log start

    if (!req.user || !req.user.nationalId) {
      console.log('getUserMeters: National ID missing in request', req.user); // Log missing nationalId
      return res.status(400).send('Invalid request. National ID missing.');
    }

    const nationalId = req.user.nationalId;
    console.log('getUserMeters: National ID found:', nationalId); // Log nationalId

    const meters = await sequelize.query(
      'SELECT * FROM Meters WHERE nationalId = :nationalId',
      {
        replacements: { nationalId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('getUserMeters: Meters found:', meters); // Log retrieved meters

    if (!meters.length) {
      console.log('getUserMeters: No meters found for National ID:', nationalId); // Log no meters found
      return res.status(404).send('No meters found for this user');
    }

    res.json(meters);

    console.log('getUserMeters: Meters information sent successfully'); // Log successful response
  } catch (err) {
    console.error('getUserMeters: Error retrieving meters:', err); // Log error details
    res.status(500).send('Internal Server Error');
  }
};
