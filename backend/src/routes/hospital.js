const express = require('express');
const router = express.Router();
const { getNearbyHospitals, getAllHospitals, createHospital, updateBedAvailability, seedPatnaHospitals } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', protect, getNearbyHospitals);
router.get('/', protect, getAllHospitals);
router.post('/seed', seedPatnaHospitals);
router.post('/', protect, authorize('admin'), createHospital);
router.put('/:id/beds', protect, updateBedAvailability);

module.exports = router;