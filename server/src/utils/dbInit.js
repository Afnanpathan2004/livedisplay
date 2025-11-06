// Database initialization script
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        employeeId: 'EMP000001',
        username: 'admin',
        email: 'admin@livedisplay.com',
        passwordHash: adminPasswordHash,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        status: 'active',
        joiningDate: new Date(),
        permissions: JSON.stringify(['all_access'])
      }
    });

    console.log('✅ Created default admin user:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Employee ID:', adminUser.employeeId);

    // Initialize default system settings
    const defaultSettings = [
      {
        key: 'auth.password_policy',
        value: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: false,
          password_history_count: 5,
          password_expiry_days: 90
        },
        description: 'Password policy configuration',
        isPublic: false
      },
      {
        key: 'auth.session_policy',
        value: {
          max_concurrent_sessions: 5,
          session_timeout_minutes: 480,
          idle_timeout_minutes: 60,
          remember_me_days: 30
        },
        description: 'Session management policy',
        isPublic: false
      },
      {
        key: 'system.display_settings',
        value: {
          default_timezone: 'UTC',
          date_format: 'YYYY-MM-DD',
          time_format: '24h',
          theme: 'light'
        },
        description: 'Display configuration',
        isPublic: true
      }
    ];

    for (const setting of defaultSettings) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key: setting.key }
      });

      if (!existing) {
        await prisma.systemSetting.create({
          data: setting
        });
        console.log(`✅ Created system setting: ${setting.key}`);
      }
    }

    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Only run if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
