const express = require('express');
const { authenticateToken } = require('../utils/auth');
const { exportSchedule, importSchedule, exportAll } = require('../controllers/exportController');

const router = express.Router();

router.get('/schedule', authenticateToken, exportSchedule);
router.post('/schedule/import', authenticateToken, importSchedule);
router.get('/all', authenticateToken, exportAll);

module.exports = router;
