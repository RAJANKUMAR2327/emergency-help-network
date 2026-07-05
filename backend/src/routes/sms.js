const express = require('express');
const router = express.Router();
const { handleInboundSMS } = require('../controllers/smsWebhookController');

// No `protect` middleware here — this is called by Twilio's servers, not
// a logged-in user, so there's no JWT to check. Security instead comes
// from validating Twilio's request signature inside the controller.
router.post('/inbound', handleInboundSMS);

module.exports = router;
