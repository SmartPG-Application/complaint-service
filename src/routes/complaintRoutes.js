const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintsByTenant,
  getComplaintById,
  updateComplaintStatus,
  updateComplaint,
  deleteComplaint,
  getComplaintStats,
  updateComplaintPriority,
  updateComplaintNote
} = require('../controllers/complaintController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.route('/')
  .post(verifyToken, createComplaint)
  .get(verifyToken, isAdmin, getComplaints);

router.get('/stats', verifyToken, isAdmin, getComplaintStats);
router.get('/tenant/:id', verifyToken, getComplaintsByTenant);

router.route('/:id')
  .get(verifyToken, getComplaintById)
  .put(verifyToken, updateComplaint)
  .delete(verifyToken, deleteComplaint);

router.put('/:id/status', verifyToken, isAdmin, updateComplaintStatus);
router.put('/:id/priority', verifyToken, isAdmin, updateComplaintPriority);
router.put('/:id/note', verifyToken, isAdmin, updateComplaintNote);

module.exports = router;
