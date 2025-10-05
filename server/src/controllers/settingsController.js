const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Default settings structure
const DEFAULT_SETTINGS = {
  rooms: [
    'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105',
    'Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205',
    'Lab 1', 'Lab 2', 'Lab 3', 'Conference Hall', 'Auditorium',
    'Seminar Hall', 'Board Room', 'Training Room'
  ],
  subjects: [
    'Computer Science Fundamentals', 'Data Structures & Algorithms',
    'Database Management Systems', 'Operating Systems', 'Computer Networks',
    'Software Engineering', 'Web Development', 'Mobile App Development',
    'Artificial Intelligence', 'Machine Learning', 'Cloud Computing',
    'Cybersecurity', 'Digital Marketing', 'Business Analytics',
    'Project Management', 'Team Meeting', 'Workshop', 'Seminar'
  ],
  faculties: [
    'Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez',
    'Prof. David Kumar', 'Dr. Lisa Anderson', 'Prof. James Wilson',
    'Dr. Maria Garcia', 'Prof. Robert Taylor', 'Dr. Jennifer Lee',
    'Prof. William Brown', 'Dr. Amanda White', 'Prof. Christopher Davis'
  ],
  departments: [
    'Computer Science', 'Information Technology', 'Electronics',
    'Mechanical', 'Civil', 'Electrical', 'Human Resources',
    'Finance', 'Marketing', 'Operations', 'Administration'
  ],
  positions: [
    'Professor', 'Associate Professor', 'Assistant Professor',
    'Lecturer', 'Senior Lecturer', 'Lab Assistant', 'Manager',
    'Senior Manager', 'Team Lead', 'Developer', 'Senior Developer',
    'Analyst', 'Consultant', 'Administrator', 'Coordinator'
  ],
  locations: [
    'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4',
    'Ground Floor', 'Basement', 'East Wing',
    'West Wing', 'North Block', 'South Block'
  ],
  amenities: [
    'Projector', 'Whiteboard', 'TV Screen', 'Video Conference',
    'Audio System', 'WiFi', 'Air Conditioning', 'Podium',
    'Microphone', 'Smart Board', 'Recording Equipment'
  ],
  companies: [
    'ABC Corporation', 'XYZ Technologies', 'Global Solutions Inc.',
    'Tech Innovators Ltd.', 'Digital Dynamics', 'Future Systems',
    'Smart Solutions', 'Enterprise Partners', 'Innovation Labs',
    'Consulting Group', 'Business Solutions', 'Other'
  ],
  purposes: [
    'Business Meeting', 'Interview', 'Consultation',
    'Training Session', 'Workshop', 'Conference',
    'Product Demo', 'Client Visit', 'Vendor Meeting',
    'Recruitment', 'Audit', 'Other'
  ]
};

// Get all settings
exports.getAllSettings = async (req, res, next) => {
  try {
    let settings = await enterpriseDb.settings.getAll();
    
    // If no settings exist, initialize with defaults
    if (!settings || Object.keys(settings).length === 0) {
      settings = DEFAULT_SETTINGS;
      await enterpriseDb.settings.initialize(DEFAULT_SETTINGS);
    }
    
    res.json(settings);
    
    logger.info('Settings retrieved', {
      userId: req.user?.id,
      categoriesCount: Object.keys(settings).length
    });
  } catch (error) {
    next(error);
  }
};

// Get settings by category
exports.getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    let settings = await enterpriseDb.settings.getAll();
    
    // Initialize with defaults if needed
    if (!settings || Object.keys(settings).length === 0) {
      settings = DEFAULT_SETTINGS;
      await enterpriseDb.settings.initialize(DEFAULT_SETTINGS);
    }
    
    if (!settings[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      category,
      items: settings[category]
    });
    
    logger.info('Settings category retrieved', {
      userId: req.user?.id,
      category,
      itemsCount: settings[category].length
    });
  } catch (error) {
    next(error);
  }
};

// Update settings for a category
exports.updateSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }
    
    // Validate category exists in defaults
    if (!DEFAULT_SETTINGS.hasOwnProperty(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Update the specific category
    await enterpriseDb.settings.updateCategory(category, items);
    
    res.json({
      message: 'Settings updated successfully',
      category,
      items
    });
    
    logger.info('Settings updated', {
      userId: req.user.id,
      category,
      itemsCount: items.length
    });
  } catch (error) {
    next(error);
  }
};

// Add item to a category
exports.addItem = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { item } = req.body;
    
    if (!item || typeof item !== 'string') {
      return res.status(400).json({ error: 'Item must be a string' });
    }
    
    let settings = await enterpriseDb.settings.getAll();
    
    if (!settings[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check for duplicates
    if (settings[category].includes(item)) {
      return res.status(400).json({ error: 'Item already exists' });
    }
    
    settings[category].push(item);
    await enterpriseDb.settings.updateCategory(category, settings[category]);
    
    res.status(201).json({
      message: 'Item added successfully',
      category,
      item,
      items: settings[category]
    });
    
    logger.info('Settings item added', {
      userId: req.user.id,
      category,
      item
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from a category
exports.removeItem = async (req, res, next) => {
  try {
    const { category, item } = req.params;
    
    let settings = await enterpriseDb.settings.getAll();
    
    if (!settings[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const index = settings[category].indexOf(item);
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    settings[category].splice(index, 1);
    await enterpriseDb.settings.updateCategory(category, settings[category]);
    
    res.json({
      message: 'Item removed successfully',
      category,
      items: settings[category]
    });
    
    logger.info('Settings item removed', {
      userId: req.user.id,
      category,
      item
    });
  } catch (error) {
    next(error);
  }
};

// Reset settings to defaults
exports.resetSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    if (category) {
      // Reset specific category
      if (!DEFAULT_SETTINGS[category]) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      await enterpriseDb.settings.updateCategory(category, DEFAULT_SETTINGS[category]);
      
      res.json({
        message: 'Category reset to defaults',
        category,
        items: DEFAULT_SETTINGS[category]
      });
    } else {
      // Reset all settings
      await enterpriseDb.settings.initialize(DEFAULT_SETTINGS);
      
      res.json({
        message: 'All settings reset to defaults',
        settings: DEFAULT_SETTINGS
      });
    }
    
    logger.info('Settings reset', {
      userId: req.user.id,
      category: category || 'all'
    });
  } catch (error) {
    next(error);
  }
};
