const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get all assets with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_ASSETS),
  assetController.getAllAssets
);

// Get asset statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_ASSETS),
  assetController.getAssetStats
);

// Get assets requiring attention
router.get('/attention', 
  requirePermission(PERMISSIONS.READ_ASSETS),
  assetController.getAssetsRequiringAttention
);

// Get asset by ID
router.get('/:id', 
  requirePermission(PERMISSIONS.READ_ASSETS),
  assetController.getAssetById
);

// Create new asset
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_ASSETS),
  assetController.createAsset
);

// Update asset
router.put('/:id', 
  requirePermission(PERMISSIONS.UPDATE_ASSETS),
  assetController.updateAsset
);

// Assign asset to employee
router.patch('/:id/assign', 
  requirePermission(PERMISSIONS.UPDATE_ASSETS),
  assetController.assignAsset
);

// Return asset (unassign)
router.patch('/:id/return', 
  requirePermission(PERMISSIONS.UPDATE_ASSETS),
  assetController.returnAsset
);

module.exports = router;
