const express = require('express');
const router = express.Router();
const { setUserVerified, listUnverifiedHelpers } = require('../controllers/usersController');
const { protect, authorize } = require('../middleware/auth');
const { validateSetVerified } = require('../middleware/validate');

router.use(protect, authorize('admin'));
router.get('/unverified', listUnverifiedHelpers);
router.put('/:id/verify', validateSetVerified, setUserVerified);

module.exports = router;
