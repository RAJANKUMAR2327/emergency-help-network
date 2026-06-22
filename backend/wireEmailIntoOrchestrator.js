const fs = require('fs');
let c = fs.readFileSync('src/services/notificationOrchestrator.js', 'utf8');

c = c.replace(
  "const { notifyNearbyHelpers } = require('./pushNotificationService');",
  "const { notifyNearbyHelpers } = require('./pushNotificationService');\nconst { notifyContactsViaEmail } = require('./emailService');"
);

c = c.replace(
  "const results = { sms: [], whatsapp: [], calls: [], push: null, errors: [] };",
  "const results = { sms: [], whatsapp: [], calls: [], email: [], push: null, errors: [] };"
);

c = c.replace(
  "const [smsR, waR, callR, pushR] = await Promise.allSettled([",
  "const [smsR, waR, callR, emailR, pushR] = await Promise.allSettled(["
);

c = c.replace(
  "nearbyHelpers.length > 0 ? notifyNearbyHelpers(nearbyHelpers, emergency) : Promise.resolve({ success: false, reason: 'No nearby helpers' }),\n    ]);",
  "contacts.filter((c) => c.email && c.notifyViaEmail).length > 0 ? notifyContactsViaEmail(contacts.filter((c) => c.notifyViaEmail), emergency, reporter.name) : Promise.resolve([]),\n      nearbyHelpers.length > 0 ? notifyNearbyHelpers(nearbyHelpers, emergency) : Promise.resolve({ success: false, reason: 'No nearby helpers' }),\n    ]);"
);

c = c.replace(
  "results.calls = callR.status === 'fulfilled' ? callR.value : [];",
  "results.calls = callR.status === 'fulfilled' ? callR.value : [];\n    results.email = emailR.status === 'fulfilled' ? emailR.value : [];"
);

c = c.replace(
  "callsMade: results.calls.filter((r) => r.success).length,",
  "callsMade: results.calls.filter((r) => r.success).length,\n      emailsSent: results.email.filter((r) => r.success).length,"
);

fs.writeFileSync('src/services/notificationOrchestrator.js', c, 'utf8');
console.log('Email wired into orchestrator');
