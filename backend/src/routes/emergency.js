const express = require('express');
const router = express.Router();
const {
  triggerEmergency,
  acceptEmergency,
  updateResponderLocation,
  resolveEmergency,
  cancelEmergency,
  markFalseAlarm,
  getActiveEmergencies,
  getSingleEmergency,
  getMessages,
  postMessage,
  rateResponder,
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');
const { validateEmergencyTrigger, validateMessage, validateRating } = require('../middleware/validate');

router.use(protect);

router.post('/trigger', validateEmergencyTrigger, triggerEmergency);
router.get('/active', getActiveEmergencies);
router.get('/:id', getSingleEmergency);
router.post('/:id/accept', acceptEmergency);
router.put('/:id/location', updateResponderLocation);
router.put('/:id/resolve', resolveEmergency);
router.put('/:id/cancel', cancelEmergency);
router.put('/:id/false-alarm', markFalseAlarm);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validateMessage, postMessage);
router.put('/:id/responders/:responderId/rate', validateRating, rateResponder);

module.exports = router;
