const Complaint = require('../models/Complaint');
const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005';

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    // ensure tenantId matches req.user.id or admin is making it for someone
    const tenantId = req.user.role === 'tenant' ? req.user.id : req.body.tenantId;

    const complaint = await Complaint.create({
      tenantId,
      title,
      description,
      category,
      priority: priority || 'Medium',
      status: 'Open'
    });
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({}).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComplaintsByTenant = async (req, res) => {
  try {
    if (req.user.role === 'tenant' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const complaints = await Complaint.find({ tenantId: req.params.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    if (req.user.role === 'tenant' && complaint.tenantId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'tenant') {
      if (complaint.tenantId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (complaint.status !== 'Open') {
        return res.status(400).json({ message: 'Cannot edit complaint that is not Open' });
      }
    }

    complaint.title = req.body.title || complaint.title;
    complaint.description = req.body.description || complaint.description;
    complaint.category = req.body.category || complaint.category;
    if (req.user.role === 'admin' && req.body.priority) {
      complaint.priority = req.body.priority;
    } else if (req.body.priority && complaint.status === 'Open') {
      complaint.priority = req.body.priority;
    }

    const updated = await complaint.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'tenant') {
      if (complaint.tenantId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (complaint.status !== 'Open') {
        return res.status(400).json({ message: 'Cannot delete complaint that is not Open' });
      }
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    complaint.status = status;
    const updated = await complaint.save();

    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        tenantId: complaint.tenantId,
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.title}" is now ${status}.`,
        type: 'complaint'
      }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (err) {
      console.warn('Failed to send notification:', err.message);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaintPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    complaint.priority = priority;
    const updated = await complaint.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaintNote = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    complaint.adminNote = adminNote;
    const updated = await complaint.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComplaintStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const result = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0, Total: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
      result.Total += s.count;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
