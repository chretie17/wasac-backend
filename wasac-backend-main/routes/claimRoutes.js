const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const auth = require('../middleware/auth');

router.post('/claim', auth, claimController.submitClaim);
router.put('/claim/:id/answer', auth, claimController.answerClaim);
router.get('/claims', auth, claimController.getAllClaims);

module.exports = router;
