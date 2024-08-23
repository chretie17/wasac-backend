const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');


router.get('/generate', reportController.generateReport);
router.get('/data', reportController.getReportData);
router.get('/by-date', reportController.getReportsByDate);

// Generate report PDF by date
router.get('/generate-by-date', reportController.generateReportByDate);
module.exports = router;
