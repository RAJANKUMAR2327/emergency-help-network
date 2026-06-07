const { admin, initFirebase } = require('../config/firebase');

const sendPushToUser = async (fcmToken, title, body, data) => {
  data = data || {};
  if (!fcmToken) return { success: false, error: 'No FCM token' };
  const app = initFirebase();
  if (!app) return { success: false, error: 'Firebase not configured' };
  const msg = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(function(e){ return [e[0], String(e[1])]; })),
    android: { priority: 'high', notification: { channelId: 'emergency_alerts', priority: 'max', defaultSound: true, visibility: 'public' } },
    apns: { payload: { aps: { sound: 'emergency.wav', badge: 1 } } },
  };
  try {
    const response = await admin.messaging().send(msg);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Push failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendPushToMultiple = async (fcmTokens, title, body, data) => {
  data = data || {};
  if (!fcmTokens || !fcmTokens.length) return [];
  const app = initFirebase();
  if (!app) return [{ success: false, error: 'Firebase not configured' }];
  const chunks = [];
  for (let i = 0; i < fcmTokens.length; i += 500) chunks.push(fcmTokens.slice(i, i + 500));
  const allResults = [];
  for (const chunk of chunks) {
    const msg = {
      tokens: chunk,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(function(e){ return [e[0], String(e[1])]; })),
      android: { priority: 'high', notification: { channelId: 'emergency_alerts', priority: 'max', defaultSound: true, visibility: 'public' } },
      apns: { payload: { aps: { sound: 'emergency.wav', badge: 1 } } },
    };
    try {
      const r = await admin.messaging().sendEachForMulticast(msg);
      allResults.push({ successCount: r.successCount, failureCount: r.failureCount });
    } catch (error) {
      console.error('Multicast error:', error.message);
    }
  }
  return allResults;
};

const notifyNearbyHelpers = async (helpers, emergency) => {
  const tokens = helpers.map(function(h){ return h.fcmToken; }).filter(Boolean);
  if (!tokens.length) return { success: false, reason: 'No FCM tokens found' };
  const lat = emergency.location && emergency.location.coordinates && emergency.location.coordinates[1];
  const lng = emergency.location && emergency.location.coordinates && emergency.location.coordinates[0];
  const labels = { medical: 'Medical Emergency', accident: 'Road Accident', fire: 'Fire', crime: 'Crime/Danger', natural_disaster: 'Natural Disaster', other: 'Emergency' };
  const typeLabel = labels[emergency.type] || 'Emergency';
  return sendPushToMultiple(
    tokens,
    'Emergency Nearby!',
    'Someone needs help near you. Can you help?',
    { emergencyId: emergency._id.toString(), type: emergency.type, severity: emergency.severity, latitude: String(lat), longitude: String(lng), screen: 'EmergencyDetail' }
  );
};

module.exports = { sendPushToUser, sendPushToMultiple, notifyNearbyHelpers };