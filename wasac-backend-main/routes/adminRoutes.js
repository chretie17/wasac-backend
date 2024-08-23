const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.post('/meters', auth, adminController.addMeter);
router.get('/applications', auth, adminController.viewAndManageApplications);
router.put('/applications/status', auth, adminController.updateApplicationStatus);
router.post('/claims/respond', auth, adminController.respondToClaim);
router.get('/meters/map', auth, adminController.viewMetersOnMap);
router.get('/reports', auth, adminController.generateReports);
// Admin Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard', adminController.getDashboardData);
router.get('/applications-by-month', adminController.getApplicationsByMonth);



module.exports = router;
