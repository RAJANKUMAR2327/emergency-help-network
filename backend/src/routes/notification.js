const express = require('express');
const router = express.Router();
const {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  sendTestAlert,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/contacts', getEmergencyContacts);
router.post('/contacts', addEmergencyContact);
router.put('/contacts/:contactId', updateEmergencyContact);
router.delete('/contacts/:contactId', deleteEmergencyContact);
router.post('/test', sendTestAlert);

module.exports = router;