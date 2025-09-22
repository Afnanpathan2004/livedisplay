const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/announcementController');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../utils/auth');

router.get('/', ctrl.listAnnouncements);
router.post('/', authenticateToken, requirePermission(PERMISSIONS.WRITE_ANNOUNCEMENTS), ctrl.createAnnouncement);
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.WRITE_ANNOUNCEMENTS), ctrl.updateAnnouncement);
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.WRITE_ANNOUNCEMENTS), ctrl.deleteAnnouncement);

module.exports = router;
