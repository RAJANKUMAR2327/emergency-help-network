const express = require('express');
const router = express.Router();
const { setDonorStatus, searchDonors } = require('../controllers/donorController');
const { protect } = require('../middleware/auth');
const { validateDonorStatus } = require('../middleware/validate');

router.use(protect);
router.put('/status', validateDonorStatus, setDonorStatus);
router.get('/search', searchDonors);

module.exports = router;
