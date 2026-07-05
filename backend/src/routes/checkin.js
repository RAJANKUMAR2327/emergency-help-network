const express = require('express');
const router = express.Router();
const {
  startCheckIn,
  confirmSafe,
  cancelCheckIn,
  extendCheckIn,
  getActiveCheckIn,
} = require('../controllers/checkinController');
const { protect } = require('../middleware/auth');
const { validateCheckIn, validateCheckInExtend } = require('../middleware/validate');

router.use(protect);

router.post('/', validateCheckIn, startCheckIn);
router.get('/active', getActiveCheckIn);
router.put('/:id/confirm', confirmSafe);
router.put('/:id/cancel', cancelCheckIn);
router.put('/:id/extend', validateCheckInExtend, extendCheckIn);

module.exports = router;
