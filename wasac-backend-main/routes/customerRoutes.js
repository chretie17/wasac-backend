const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.post('/apply', auth, customerController.applyForMutation);
router.get('/applications', auth, customerController.trackApplicationStatus);
router.post('/claims', auth, customerController.submitClaim);
router.get('/meters', auth, customerController.viewMeterOnMap);
router.get('/customer/:nationalId', customerController.getCustomerByNationalId);


module.exports = router;
