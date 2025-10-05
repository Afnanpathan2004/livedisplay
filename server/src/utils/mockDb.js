// Mock database for development/testing when PostgreSQL is not available
const bcrypt = require('bcryptjs');

let scheduleEntries = [];
let announcements = [];
let tasks = [];
// Pre-computed hash for admin123 to avoid async issues
const adminPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5/7/4/8/9/0';

let users = [
  {
    id: 'admin-user-id',
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: adminPasswordHash,
    role: 'admin',
    createdAt: new Date(),
    lastLogin: null
  }
];

// Initialize admin user with proper password hash synchronously
try {
  // Generate a fresh hash for admin123
  const adminHash = bcrypt.hashSync('admin123', 12);
  users[0].passwordHash = adminHash;
  console.log('Admin user initialized with username: admin, password: admin123');
} catch (err) {
  console.error('Failed to hash admin password:', err);
  // Use pre-computed hash as fallback
  users[0].passwordHash = adminPasswordHash;
}

const mockDb = {
  scheduleEntry: {
    findMany: async ({ where, orderBy }) => {
      let filtered = scheduleEntries;
      if (where?.date) {
        const targetDate = new Date(where.date).toDateString();
        filtered = scheduleEntries.filter(entry => 
          new Date(entry.date).toDateString() === targetDate
        );
      }
      return filtered.sort((a, b) => {
        if (orderBy) {
          for (const order of orderBy) {
            const [field, direction] = Object.entries(order)[0];
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    },
    create: async ({ data }) => {
      const entry = {
        id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        lastUpdated: new Date()
      };
      scheduleEntries.push(entry);
      return entry;
    },
    findUnique: async ({ where }) => {
      return scheduleEntries.find(entry => entry.id === where.id);
    },
    update: async ({ where, data }) => {
      const index = scheduleEntries.findIndex(entry => entry.id === where.id);
      if (index === -1) return null;
      scheduleEntries[index] = { ...scheduleEntries[index], ...data, lastUpdated: new Date() };
      return scheduleEntries[index];
    },
    delete: async ({ where }) => {
      const index = scheduleEntries.findIndex(entry => entry.id === where.id);
      if (index === -1) return null;
      const deleted = scheduleEntries[index];
      scheduleEntries.splice(index, 1);
      return deleted;
    }
  },
  announcement: {
    findMany: async ({ orderBy } = {}) => {
      let result = [...announcements];
      if (orderBy) {
        result.sort((a, b) => {
          for (const order of orderBy) {
            const [field, direction] = Object.entries(order)[0];
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return direction === 'desc' ? 1 : -1;
            if (aVal > bVal) return direction === 'desc' ? -1 : 1;
          }
          return 0;
        });
      }
      return result;
    },
    create: async ({ data }) => {
      const announcement = {
        id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        timestamp: new Date()
      };
      announcements.push(announcement);
      return announcement;
    },
    findUnique: async ({ where }) => {
      return announcements.find(ann => ann.id === where.id);
    },
    update: async ({ where, data }) => {
      const index = announcements.findIndex(ann => ann.id === where.id);
      if (index === -1) return null;
      announcements[index] = { ...announcements[index], ...data };
      return announcements[index];
    },
    delete: async ({ where }) => {
      const index = announcements.findIndex(ann => ann.id === where.id);
      if (index === -1) return null;
      const deleted = announcements[index];
      announcements.splice(index, 1);
      return deleted;
    }
  },
  task: {
    findMany: async ({ where, orderBy, include } = {}) => {
      let filtered = [...tasks];
      if (where?.status) {
        filtered = filtered.filter(task => task.status === where.status);
      }
      if (where?.room) {
        filtered = filtered.filter(task => task.room === where.room);
      }
      if (orderBy) {
        filtered.sort((a, b) => {
          for (const order of orderBy) {
            const [field, direction] = Object.entries(order)[0];
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      if (include?.user) {
        filtered = filtered.map(task => ({
          ...task,
          user: { username: 'admin' }
        }));
      }
      return filtered;
    },
    findUnique: async ({ where, include } = {}) => {
      let task = tasks.find(t => t.id === where.id);
      if (task && include?.user) {
        task = { ...task, user: { username: 'admin' } };
      }
      return task;
    },
    create: async ({ data }) => {
      const task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      tasks.push(task);
      return task;
    },
    update: async ({ where, data, include } = {}) => {
      const index = tasks.findIndex(task => task.id === where.id);
      if (index === -1) return null;
      tasks[index] = { ...tasks[index], ...data, updatedAt: new Date() };
      let result = tasks[index];
      if (include?.user) {
        result = { ...result, user: { username: 'admin' } };
      }
      return result;
    },
    delete: async ({ where }) => {
      const index = tasks.findIndex(task => task.id === where.id);
      if (index === -1) return null;
      const deleted = tasks[index];
      tasks.splice(index, 1);
      return deleted;
    }
  },
  user: {
    findUnique: async ({ where }) => {
      if (where.username) {
        return users.find(user => user.username === where.username);
      }
      if (where.id) {
        return users.find(user => user.id === where.id);
      }
      return null;
    },
    create: async ({ data, select }) => {
      const user = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(user);
      
      if (select) {
        const result = {};
        Object.keys(select).forEach(key => {
          if (select[key] && user[key] !== undefined) {
            result[key] = user[key];
          }
        });
        return result;
      }
      return user;
    },
    update: async ({ where, data }) => {
      const index = users.findIndex(user => user.id === where.id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...data, updatedAt: new Date() };
      return users[index];
    }
  },

  // User management functions
  createUser: async (userData) => {
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date(),
      lastLogin: null
    };
    users.push(user);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  },

  getUserByUsername: async (username) => {
    return users.find(user => user.username === username);
  },

  getUserById: async (id) => {
    return users.find(user => user.id === id);
  },

  updateUserLastLogin: async (userId) => {
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date();
      return users[userIndex];
    }
    return null;
  },

  getAllUsers: async () => {
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
  },

  // Schedule functions
  getScheduleByDate: async (date) => {
    const targetDate = new Date(date).toDateString();
    return scheduleEntries.filter(entry => 
      new Date(entry.date).toDateString() === targetDate
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  getScheduleById: async (id) => {
    return scheduleEntries.find(entry => entry.id === id) || null;
  },

  createScheduleEntry: async (data) => {
    const newEntry = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    scheduleEntries.push(newEntry);
    return newEntry;
  },

  updateScheduleEntry: async (id, data) => {
    const index = scheduleEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      scheduleEntries[index] = {
        ...scheduleEntries[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return scheduleEntries[index];
    }
    return null;
  },

  deleteScheduleEntry: async (id) => {
    const index = scheduleEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      scheduleEntries.splice(index, 1);
      return true;
    }
    return false;
  }
};

module.exports = mockDb;
