const express = require('express');
const router = express.Router();
const { getNearbyHospitals, getAllHospitals, createHospital, updateBedAvailability, seedPatnaHospitals } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', protect, getNearbyHospitals);
router.get('/', protect, getAllHospitals);

// Was completely unauthenticated — anyone could call this and it runs
// Hospital.deleteMany({}) before reseeding, wiping every real hospital
// record in production. Restricted to admin only.
router.post('/seed', protect, authorize('admin'), seedPatnaHospitals);

router.post('/', protect, authorize('admin'), createHospital);

// Was `protect` only — any logged-in user (a regular reporter, not just
// hospital staff) could update any hospital's bed counts. Restricted to
// admin/hospital roles.
// Note: this still doesn't scope a 'hospital'-role user to *their own*
// hospital specifically — the schema has no Hospital-to-User link yet,
// so any hospital-role account can currently edit any hospital's beds.
// Fixing that fully needs a `hospital.manager` (User ref) field and a
// check here that req.user._id matches it — worth doing before onboarding
// multiple real hospitals, but out of scope for this pass.
router.put('/:id/beds', protect, authorize('admin', 'hospital'), updateBedAvailability);

module.exports = router;
