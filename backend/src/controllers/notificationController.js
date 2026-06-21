const EmergencyContact = require('../models/EmergencyContact');
const { sendSMS } = require('../services/smsService');
const { sendWhatsApp } = require('../services/whatsappService');
const { makeEmergencyCall } = require('../services/callService');

exports.getEmergencyContacts = async (req, res, next) => {
  try {
    const doc = await EmergencyContact.findOne({ user: req.user._id });
    res.status(200).json({ success: true, data: doc ? doc.contacts : [] });
  } catch (e) { next(e); }
};

exports.addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, notifyViaSMS, notifyViaWhatsApp, notifyViaCall, notifyViaEmail } = req.body;
    if (!name || (!phone && !email)) return res.status(400).json({ success: false, message: 'Name and at least one of phone or email is required' });
    let doc = await EmergencyContact.findOne({ user: req.user._id });
    if (!doc) doc = await EmergencyContact.create({ user: req.user._id, contacts: [] });
    if (doc.contacts.length >= 5) return res.status(400).json({ success: false, message: 'Maximum 5 contacts allowed' });
    doc.contacts.push({ name, phone, email, relationship, notifyViaSMS: notifyViaSMS !== false, notifyViaWhatsApp: notifyViaWhatsApp !== false, notifyViaCall: notifyViaCall === true, notifyViaEmail: notifyViaEmail !== false });
    await doc.save();
    res.status(201).json({ success: true, data: doc.contacts });
  } catch (e) { next(e); }
};

exports.updateEmergencyContact = async (req, res, next) => {
  try {
    const doc = await EmergencyContact.findOne({ user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const contact = doc.contacts.id(req.params.contactId);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    Object.assign(contact, req.body);
    await doc.save();
    res.status(200).json({ success: true, data: doc.contacts });
  } catch (e) { next(e); }
};

exports.deleteEmergencyContact = async (req, res, next) => {
  try {
    const doc = await EmergencyContact.findOne({ user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    doc.contacts = doc.contacts.filter(function(c) { return c._id.toString() !== req.params.contactId; });
    await doc.save();
    res.status(200).json({ success: true, data: doc.contacts });
  } catch (e) { next(e); }
};

exports.sendTestAlert = async (req, res, next) => {
  try {
    const { channel, phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
    let result;
    if (channel === 'sms') {
      result = await sendSMS(phone, 'Test alert from Emergency Help Network. Your account is set up correctly.');
    } else if (channel === 'whatsapp') {
      result = await sendWhatsApp(phone, 'Test alert from Emergency Help Network.');
    } else if (channel === 'call') {
      result = await makeEmergencyCall(phone, req.user.name, 'other', 'test location');
    } else if (channel === 'email') {
      const { sendTestEmail } = require('../services/emailService');
      result = await sendTestEmail(phone);

    } else {
      return res.status(400).json({ success: false, message: 'Invalid channel' });
    }
    res.status(200).json({ success: true, result });
  } catch (e) { next(e); }
};