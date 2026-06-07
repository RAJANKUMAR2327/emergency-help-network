const Hospital = require('../models/Hospital');

exports.getNearbyHospitals = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;
    if (!longitude || !latitude) return res.status(400).json({ success: false, message: 'Location required' });
    const hospitals = await Hospital.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).limit(10);
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true });
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBedAvailability = async (req, res) => {
  try {
    const { availableBeds, availableIcuBeds } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { availableBeds, availableIcuBeds },
      { new: true }
    );
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    const io = req.app.get('io');
    if (io) io.emit('hospital_beds_updated', { hospitalId: hospital._id, availableBeds, availableIcuBeds });
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedPatnaHospitals = async (req, res) => {
  try {
    await Hospital.deleteMany({});
    const hospitals = [
      { name: 'AIIMS Patna', phone: '0612-2451070', address: 'Phulwarisharif, Patna, Bihar 801507', location: { type: 'Point', coordinates: [85.0601, 25.5478] }, specialties: ['Cardiology','Neurology','Trauma','ICU'], totalBeds: 960, availableBeds: 120, icuBeds: 80, availableIcuBeds: 15, hasBloodBank: true, emergencyContact: '0612-2451070' },
      { name: 'PMCH Patna', phone: '0612-2300629', address: 'Ashok Rajpath, Patna, Bihar 800004', location: { type: 'Point', coordinates: [85.1376, 25.6063] }, specialties: ['General','Surgery','Pediatrics','Burns'], totalBeds: 1700, availableBeds: 200, icuBeds: 60, availableIcuBeds: 8, hasBloodBank: true, emergencyContact: '0612-2300629' },
      { name: 'Paras HMRI Hospital', phone: '0612-3540100', address: 'Raja Bazaar, Patna, Bihar 800014', location: { type: 'Point', coordinates: [85.1336, 25.6028] }, specialties: ['Cardiology','Orthopedics','Neurology'], totalBeds: 350, availableBeds: 45, icuBeds: 30, availableIcuBeds: 6, hasBloodBank: true, emergencyContact: '0612-3540100' },
      { name: 'Ruban Memorial Hospital', phone: '0612-2522333', address: 'Boring Road, Patna, Bihar 800001', location: { type: 'Point', coordinates: [85.1200, 25.6095] }, specialties: ['Maternity','Pediatrics','General'], totalBeds: 200, availableBeds: 30, icuBeds: 20, availableIcuBeds: 4, hasBloodBank: false, emergencyContact: '0612-2522333' },
      { name: 'Nalanda Medical College', phone: '0612-2281121', address: 'Kankarbagh, Patna, Bihar 800020', location: { type: 'Point', coordinates: [85.1550, 25.5950] }, specialties: ['General','Surgery','Trauma'], totalBeds: 750, availableBeds: 90, icuBeds: 40, availableIcuBeds: 10, hasBloodBank: true, emergencyContact: '0612-2281121' },
    ];
    await Hospital.insertMany(hospitals);
    res.status(201).json({ success: true, message: '5 Patna hospitals seeded', count: hospitals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};