const express = require('express');
const router = express.Router();
const {
  triggerEmergency,
  acceptEmergency,
  updateResponderLocation,
  resolveEmergency,
  cancelEmergency,
  getActiveEmergencies,
  getSingleEmergency,
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/trigger', triggerEmergency);
router.get('/active', getActiveEmergencies);
router.get('/:id', getSingleEmergency);
router.post('/:id/accept', acceptEmergency);
router.put('/:id/location', updateResponderLocation);
router.put('/:id/resolve', resolveEmergency);
router.put('/:id/cancel', cancelEmergency);  // NEW

module.exports = router;
