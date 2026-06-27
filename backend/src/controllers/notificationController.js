const EmergencyContact = require('../models/EmergencyContact');
const { sendSMS } = require('../services/smsService');
const { sendWhatsApp } = require('../services/whatsappService');
const { makeEmergencyCall } = require('../services/callService');
const { sendTestEmail } = require('../services/emailService');

exports.getEmergencyContacts = async (req, res, next) => {
  try {
    const doc = await EmergencyContact.findOne({ user: req.user._id });
    res.status(200).json({ success: true, data: doc ? doc.contacts : [] });
  } catch (e) { next(e); }
};

exports.addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, notifyViaSMS, notifyViaWhatsApp, notifyViaCall, notifyViaEmail } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!phone && !email) return res.status(400).json({ success: false, message: 'At least one of phone or email is required' });

    let doc = await EmergencyContact.findOne({ user: req.user._id });
    if (!doc) doc = await EmergencyContact.create({ user: req.user._id, contacts: [] });
    if (doc.contacts.length >= 5) return res.status(400).json({ success: false, message: 'Maximum 5 contacts allowed' });

    doc.contacts.push({
      name,
      phone: phone || null,
      email: email || null,
      relationship,
      notifyViaSMS: phone ? notifyViaSMS !== false : false,
      notifyViaWhatsApp: phone ? notifyViaWhatsApp !== false : false,
      notifyViaCall: phone ? notifyViaCall === true : false,
      notifyViaEmail: email ? notifyViaEmail !== false : false,
    });
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
    const before = doc.contacts.length;
    doc.contacts = doc.contacts.filter((c) => c._id.toString() !== req.params.contactId);
    if (doc.contacts.length === before) return res.status(404).json({ success: false, message: 'Contact not found' });
    await doc.save();
    res.status(200).json({ success: true, data: doc.contacts });
  } catch (e) { next(e); }
};

exports.sendTestAlert = async (req, res, next) => {
  try {
    const { channel, phone, email } = req.body;
    let result;
    if (channel === 'sms') {
      if (!phone) return res.status(400).json({ success: false, message: 'phone required for SMS test' });
      result = await sendSMS(phone, 'Test alert from Emergency Help Network. Your account is set up correctly.');
    } else if (channel === 'whatsapp') {
      if (!phone) return res.status(400).json({ success: false, message: 'phone required for WhatsApp test' });
      result = await sendWhatsApp(phone, 'Test alert from Emergency Help Network.');
    } else if (channel === 'call') {
      if (!phone) return res.status(400).json({ success: false, message: 'phone required for call test' });
      result = await makeEmergencyCall(phone, req.user.name, 'other', 'test location');
    } else if (channel === 'email') {
      if (!email) return res.status(400).json({ success: false, message: 'email required for email test' });
      result = await sendTestEmail(email);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid channel. Use: sms, whatsapp, call, email' });
    }
    res.status(200).json({ success: true, result });
  } catch (e) { next(e); }
};
