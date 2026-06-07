const { admin, initFirebase } = require('../config/firebase');

initFirebase();

const sendPushToUser = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return { success: false, error: 'No FCM token' };
  const app = initFirebase();
  if (!app) return { success: false, error: 'Firebase not configured' };

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: {
      priority: 'high',
      notification: {
        channelId: 'emergency_alerts',
        priority: 'max',
        defaultSound: true,
        visibility: 'public',
      },
    },
    apns: {
      payload: {
        aps: { sound: 'emergency.wav', badge: 1, interruptionLevel: 'critical' },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Push failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens?.length) return [];
  const app = initFirebase();
  if (!app) return [{ success: false, error: 'Firebase not configured' }];

  const chunks = [];
  for (let i = 0; i < fcmTokens.length; i += 500) {
    chunks.push(fcmTokens.slice(i, i + 500));
  }

  const allResults = [];
  for (const chunk of chunks) {
    const message = {
      tokens: chunk,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: {
          channelId: 'emergency_alerts',
          priority: 'max',
          defaultSound: true,
          visibility: 'public',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'emergency.wav', badge: 1, interruptionLevel: 'critical' },
        },
      },
    };
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      allResults.push({
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    } catch (error) {
      console.error('Multicast push error:', error.message);
    }
  }
  return allResults;
};

const notifyNearbyHelpers = async (helpers, emergency) => {
  const tokens = helpers.map((h) => h.fcmToken).filter(Boolean);
  if (!tokens.length) return { success: false, reason: 'No FCM tokens found' };

  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const typeLabel = {
    medical: 'Medical Emergency',
    accident: 'Road Accident',
    fire: 'Fire',
    crime: 'Crime / Danger',
    natural_disaster: 'Natural Disaster',
    other: 'Emergency',
  }[emergency.type] || 'Emergency';

  return sendPushToMultiple(
    tokens,
    `🚨 ${typeLabel} Nearby!`,
    `Someone needs help ${emergency.location?.address ? 'at ' + emergency.location.address : 'near you'}. Can you help?`,
    {
      emergencyId: emergency._id.toString(),
      type: emergency.type,
      severity: emergency.severity,
      latitude: String(lat),
      longitude: String(lng),
      screen: 'EmergencyDetail',
    }
  );
};

module.exports = { sendPushToUser, sendPushToMultiple, notifyNearbyHelpers };