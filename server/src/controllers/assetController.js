const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get all assets with filtering
exports.getAllAssets = async (req, res, next) => {
  try {
    const { category, status, assignedTo, buildingId, search } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;
    
    let assets = await enterpriseDb.assets.findAll(filters);
    
    // Filter by building location
    if (buildingId) {
      assets = assets.filter(asset => 
        asset.currentLocation && asset.currentLocation.buildingId === buildingId
      );
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      assets = assets.filter(asset => 
        asset.name.toLowerCase().includes(searchLower) ||
        asset.assetTag.toLowerCase().includes(searchLower) ||
        asset.brand.toLowerCase().includes(searchLower) ||
        asset.model.toLowerCase().includes(searchLower) ||
        asset.serialNumber.toLowerCase().includes(searchLower)
      );
    }
    
    // Enrich with employee and location details
    const enrichedAssets = await Promise.all(assets.map(async (asset) => {
      let assignedEmployee = null;
      if (asset.assignedTo) {
        const employee = await enterpriseDb.employees.findById(asset.assignedTo);
        if (employee) {
          assignedEmployee = {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            department: employee.department
          };
        }
      }
      
      let location = null;
      if (asset.currentLocation) {
        const building = await enterpriseDb.buildings.findById(asset.currentLocation.buildingId);
        const floor = await enterpriseDb.floors.findById(asset.currentLocation.floorId);
        const room = await enterpriseDb.rooms.findById(asset.currentLocation.roomId);
        
        location = {
          building: building ? building.name : null,
          floor: floor ? floor.name : null,
          room: room ? room.name : null
        };
      }
      
      return {
        ...asset,
        assignedEmployee,
        location
      };
    }));
    
    res.json({
      assets: enrichedAssets,
      total: enrichedAssets.length,
      filters: { category, status, assignedTo, buildingId, search }
    });
    
    logger.info('Assets retrieved', {
      userId: req.user.id,
      count: enrichedAssets.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Get asset by ID
exports.getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await enterpriseDb.assets.findById(id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Enrich with details
    let assignedEmployee = null;
    if (asset.assignedTo) {
      const employee = await enterpriseDb.employees.findById(asset.assignedTo);
      if (employee) {
        assignedEmployee = {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          department: employee.department,
          email: employee.email,
          phone: employee.phone
        };
      }
    }
    
    res.json({
      ...asset,
      assignedEmployee
    });
    
    logger.info('Asset details retrieved', {
      userId: req.user.id,
      assetId: id
    });
  } catch (error) {
    next(error);
  }
};

// Create new asset
exports.createAsset = async (req, res, next) => {
  try {
    const assetData = req.body;
    
    // Generate asset tag
    const category = assetData.category.toUpperCase().substring(0, 3);
    const existingAssets = await enterpriseDb.assets.findAll({ category: assetData.category });
    const maxNumber = Math.max(...existingAssets.map(asset => {
      const match = asset.assetTag.match(/\d+$/);
      return match ? parseInt(match[0]) : 0;
    }), 0);
    
    assetData.assetTag = `TM-${category}-${String(maxNumber + 1).padStart(6, '0')}`;
    
    // Set initial status
    assetData.status = assetData.status || 'available';
    assetData.condition = assetData.condition || 'excellent';
    
    const asset = await enterpriseDb.assets.create(assetData);
    
    // Create notification for asset creation
    await enterpriseDb.notifications.create({
      type: 'asset',
      title: 'New Asset Added',
      message: `New ${asset.category} asset ${asset.name} (${asset.assetTag}) has been added to inventory`,
      recipientType: 'department',
      recipients: ['IT', 'admin'],
      senderId: req.user.id,
      priority: 'low',
      channels: ['push']
    });
    
    res.status(201).json({
      message: 'Asset created successfully',
      asset
    });
    
    logger.info('Asset created', {
      userId: req.user.id,
      assetId: asset.id,
      assetTag: asset.assetTag
    });
  } catch (error) {
    next(error);
  }
};

// Update asset
exports.updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const asset = await enterpriseDb.assets.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Track assignment changes
    if (updateData.assignedTo && updateData.assignedTo !== asset.assignedTo) {
      const employee = await enterpriseDb.employees.findById(updateData.assignedTo);
      if (employee) {
        // Notify new assignee
        await enterpriseDb.notifications.create({
          type: 'asset',
          title: 'Asset Assigned',
          message: `Asset ${asset.name} (${asset.assetTag}) has been assigned to you`,
          recipientType: 'individual',
          recipients: [updateData.assignedTo],
          senderId: req.user.id,
          priority: 'medium',
          channels: ['email', 'push']
        });
        
        updateData.status = 'assigned';
      }
    }
    
    // Track status changes
    if (updateData.status && updateData.status !== asset.status) {
      if (updateData.status === 'maintenance') {
        // Notify maintenance team
        await enterpriseDb.notifications.create({
          type: 'asset',
          title: 'Asset Maintenance Required',
          message: `Asset ${asset.name} (${asset.assetTag}) requires maintenance`,
          recipientType: 'department',
          recipients: ['maintenance'],
          senderId: req.user.id,
          priority: 'high',
          channels: ['email']
        });
      }
    }
    
    const updatedAsset = await enterpriseDb.assets.update(id, updateData);
    
    res.json({
      message: 'Asset updated successfully',
      asset: updatedAsset
    });
    
    logger.info('Asset updated', {
      userId: req.user.id,
      assetId: id,
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    next(error);
  }
};

// Assign asset to employee
exports.assignAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeId, location } = req.body;
    
    const asset = await enterpriseDb.assets.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    if (asset.status === 'assigned') {
      return res.status(400).json({ error: 'Asset is already assigned' });
    }
    
    const employee = await enterpriseDb.employees.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const updateData = {
      assignedTo: employeeId,
      status: 'assigned',
      currentLocation: location || {
        buildingId: employee.buildingId,
        floorId: employee.floorId,
        roomId: employee.workstation
      }
    };
    
    await enterpriseDb.assets.update(id, updateData);
    
    // Send notification to employee
    await enterpriseDb.notifications.create({
      type: 'asset',
      title: 'Asset Assigned',
      message: `${asset.name} (${asset.assetTag}) has been assigned to you. Please acknowledge receipt.`,
      recipientType: 'individual',
      recipients: [employeeId],
      senderId: req.user.id,
      priority: 'medium',
      channels: ['email', 'push']
    });
    
    res.json({ message: 'Asset assigned successfully' });
    
    logger.info('Asset assigned', {
      userId: req.user.id,
      assetId: id,
      assignedTo: employeeId
    });
  } catch (error) {
    next(error);
  }
};

// Return asset (unassign)
exports.returnAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition, notes, newLocation } = req.body;
    
    const asset = await enterpriseDb.assets.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Check permissions - only assigned employee or admin can return
    if (req.user.role !== 'admin' && req.user.id !== asset.assignedTo) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const updateData = {
      assignedTo: null,
      status: 'available',
      condition: condition || asset.condition,
      currentLocation: newLocation || asset.currentLocation
    };
    
    if (notes) {
      updateData.returnNotes = notes;
    }
    
    await enterpriseDb.assets.update(id, updateData);
    
    // Notify IT/Admin about return
    await enterpriseDb.notifications.create({
      type: 'asset',
      title: 'Asset Returned',
      message: `Asset ${asset.name} (${asset.assetTag}) has been returned by ${req.user.firstName} ${req.user.lastName}`,
      recipientType: 'department',
      recipients: ['IT', 'admin'],
      senderId: req.user.id,
      priority: 'low',
      channels: ['push']
    });
    
    res.json({ message: 'Asset returned successfully' });
    
    logger.info('Asset returned', {
      userId: req.user.id,
      assetId: id,
      condition,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// Get asset statistics
exports.getAssetStats = async (req, res, next) => {
  try {
    const { category, buildingId } = req.query;
    
    let assets = await enterpriseDb.assets.findAll();
    
    if (category) {
      assets = assets.filter(asset => asset.category === category);
    }
    
    if (buildingId) {
      assets = assets.filter(asset => 
        asset.currentLocation && asset.currentLocation.buildingId === buildingId
      );
    }
    
    const stats = {
      totalAssets: assets.length,
      availableAssets: assets.filter(a => a.status === 'available').length,
      assignedAssets: assets.filter(a => a.status === 'assigned').length,
      maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
      disposedAssets: assets.filter(a => a.status === 'disposed').length,
      
      totalValue: assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
      
      categoryStats: {},
      conditionStats: {
        excellent: assets.filter(a => a.condition === 'excellent').length,
        good: assets.filter(a => a.condition === 'good').length,
        fair: assets.filter(a => a.condition === 'fair').length,
        poor: assets.filter(a => a.condition === 'poor').length
      },
      
      warrantyExpiring: assets.filter(asset => {
        if (!asset.warrantyExpiry) return false;
        const expiry = new Date(asset.warrantyExpiry);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiry <= thirtyDaysFromNow && expiry >= new Date();
      }).length,
      
      maintenanceDue: assets.filter(asset => {
        if (!asset.nextMaintenanceDate) return false;
        return new Date(asset.nextMaintenanceDate) <= new Date();
      }).length
    };
    
    // Calculate category stats
    assets.forEach(asset => {
      if (!stats.categoryStats[asset.category]) {
        stats.categoryStats[asset.category] = {
          total: 0,
          available: 0,
          assigned: 0,
          maintenance: 0,
          value: 0
        };
      }
      
      stats.categoryStats[asset.category].total++;
      stats.categoryStats[asset.category][asset.status]++;
      stats.categoryStats[asset.category].value += asset.purchasePrice || 0;
    });
    
    res.json({ stats });
    
    logger.info('Asset statistics retrieved', {
      userId: req.user.id,
      totalAssets: stats.totalAssets,
      category,
      buildingId
    });
  } catch (error) {
    next(error);
  }
};

// Get assets requiring attention (maintenance, warranty expiry)
exports.getAssetsRequiringAttention = async (req, res, next) => {
  try {
    const assets = await enterpriseDb.assets.findAll();
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const attention = {
      maintenanceDue: [],
      warrantyExpiring: [],
      poorCondition: [],
      unassignedHighValue: []
    };
    
    for (const asset of assets) {
      // Maintenance due
      if (asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) <= today) {
        attention.maintenanceDue.push(asset);
      }
      
      // Warranty expiring
      if (asset.warrantyExpiry) {
        const expiry = new Date(asset.warrantyExpiry);
        if (expiry <= thirtyDaysFromNow && expiry >= today) {
          attention.warrantyExpiring.push(asset);
        }
      }
      
      // Poor condition
      if (asset.condition === 'poor') {
        attention.poorCondition.push(asset);
      }
      
      // Unassigned high-value assets
      if (asset.status === 'available' && (asset.purchasePrice || 0) > 50000) {
        attention.unassignedHighValue.push(asset);
      }
    }
    
    res.json({
      attention,
      summary: {
        maintenanceDue: attention.maintenanceDue.length,
        warrantyExpiring: attention.warrantyExpiring.length,
        poorCondition: attention.poorCondition.length,
        unassignedHighValue: attention.unassignedHighValue.length
      }
    });
    
    logger.info('Assets requiring attention retrieved', {
      userId: req.user.id,
      maintenanceDue: attention.maintenanceDue.length,
      warrantyExpiring: attention.warrantyExpiring.length
    });
  } catch (error) {
    next(error);
  }
};
