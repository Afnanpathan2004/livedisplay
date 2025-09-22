// Enterprise Office Management System - Database Schemas

const employeeSchema = {
  id: 'string',
  employeeId: 'string', // TM001234
  firstName: 'string',
  lastName: 'string',
  email: 'string',
  phone: 'string',
  department: 'string',
  designation: 'string',
  reportingManager: 'string', // employee ID
  buildingId: 'string',
  floorId: 'string',
  workstation: 'string',
  joiningDate: 'date',
  status: 'active|inactive|on_leave',
  profilePicture: 'string',
  emergencyContact: {
    name: 'string',
    phone: 'string',
    relation: 'string'
  },
  permissions: 'array', // room_booking, visitor_invite, etc.
  createdAt: 'date',
  updatedAt: 'date'
};

const buildingSchema = {
  id: 'string',
  name: 'string',
  address: 'string',
  totalFloors: 'number',
  capacity: 'number',
  facilities: 'array', // parking, cafeteria, gym, etc.
  securityLevel: 'low|medium|high',
  isActive: 'boolean',
  createdAt: 'date'
};

const floorSchema = {
  id: 'string',
  buildingId: 'string',
  floorNumber: 'number',
  name: 'string', // Ground Floor, First Floor, etc.
  totalRooms: 'number',
  capacity: 'number',
  facilities: 'array',
  floorPlan: 'string', // image URL
  isActive: 'boolean'
};

const roomSchema = {
  id: 'string',
  buildingId: 'string',
  floorId: 'string',
  roomNumber: 'string',
  name: 'string',
  type: 'meeting|conference|training|cabin|workstation|cafeteria|restroom',
  capacity: 'number',
  facilities: 'array', // projector, whiteboard, AC, etc.
  isBookable: 'boolean',
  requiresApproval: 'boolean',
  approvers: 'array', // employee IDs who can approve
  hourlyRate: 'number',
  images: 'array',
  status: 'available|occupied|maintenance|reserved',
  createdAt: 'date'
};

const bookingSchema = {
  id: 'string',
  roomId: 'string',
  employeeId: 'string',
  title: 'string',
  description: 'string',
  startTime: 'datetime',
  endTime: 'datetime',
  attendees: 'array', // employee IDs
  externalGuests: 'array',
  purpose: 'string',
  status: 'pending|approved|rejected|completed|cancelled',
  approvedBy: 'string', // employee ID
  approvalDate: 'datetime',
  rejectionReason: 'string',
  recurringPattern: 'none|daily|weekly|monthly',
  recurringEndDate: 'date',
  cost: 'number',
  createdAt: 'date',
  updatedAt: 'date'
};

const visitorSchema = {
  id: 'string',
  name: 'string',
  email: 'string',
  phone: 'string',
  company: 'string',
  idType: 'aadhar|pan|driving_license|passport',
  idNumber: 'string',
  photo: 'string',
  hostEmployeeId: 'string',
  purpose: 'string',
  buildingId: 'string',
  floorId: 'string',
  visitDate: 'date',
  expectedArrival: 'datetime',
  expectedDeparture: 'datetime',
  actualArrival: 'datetime',
  actualDeparture: 'datetime',
  status: 'scheduled|arrived|departed|cancelled',
  securityApproval: 'pending|approved|rejected',
  visitorBadge: 'string',
  escortRequired: 'boolean',
  vehicleNumber: 'string',
  createdAt: 'date'
};

const assetSchema = {
  id: 'string',
  assetTag: 'string', // TM-LAP-001234
  name: 'string',
  category: 'laptop|desktop|monitor|printer|furniture|vehicle|mobile',
  brand: 'string',
  model: 'string',
  serialNumber: 'string',
  purchaseDate: 'date',
  purchasePrice: 'number',
  vendor: 'string',
  warrantyExpiry: 'date',
  currentLocation: {
    buildingId: 'string',
    floorId: 'string',
    roomId: 'string'
  },
  assignedTo: 'string', // employee ID
  status: 'available|assigned|maintenance|disposed',
  condition: 'excellent|good|fair|poor',
  lastMaintenanceDate: 'date',
  nextMaintenanceDate: 'date',
  specifications: 'object',
  images: 'array',
  createdAt: 'date',
  updatedAt: 'date'
};

const attendanceSchema = {
  id: 'string',
  employeeId: 'string',
  date: 'date',
  checkIn: 'datetime',
  checkOut: 'datetime',
  breakStart: 'datetime',
  breakEnd: 'datetime',
  totalHours: 'number',
  status: 'present|absent|half_day|late|early_departure',
  location: 'office|wfh|client_site',
  buildingId: 'string',
  remarks: 'string',
  approvedBy: 'string',
  createdAt: 'date'
};

const leaveSchema = {
  id: 'string',
  employeeId: 'string',
  leaveType: 'casual|sick|earned|maternity|paternity|emergency',
  startDate: 'date',
  endDate: 'date',
  totalDays: 'number',
  reason: 'string',
  status: 'pending|approved|rejected',
  approvedBy: 'string',
  approvalDate: 'datetime',
  rejectionReason: 'string',
  documents: 'array', // medical certificates, etc.
  emergencyContact: 'string',
  handoverTo: 'string', // employee ID
  createdAt: 'date',
  updatedAt: 'date'
};

const departmentSchema = {
  id: 'string',
  name: 'string',
  code: 'string', // HR, IT, FIN, etc.
  headOfDepartment: 'string', // employee ID
  buildingId: 'string',
  floorId: 'string',
  budget: 'number',
  employeeCount: 'number',
  description: 'string',
  isActive: 'boolean',
  createdAt: 'date'
};

const notificationSchema = {
  id: 'string',
  type: 'booking|visitor|leave|asset|announcement|emergency',
  title: 'string',
  message: 'string',
  recipientType: 'individual|department|building|all',
  recipients: 'array', // employee IDs
  senderId: 'string',
  priority: 'low|medium|high|urgent',
  channels: 'array', // email, sms, push, display
  scheduledAt: 'datetime',
  sentAt: 'datetime',
  readBy: 'array', // employee IDs who read
  status: 'draft|scheduled|sent|failed',
  createdAt: 'date'
};

const reportSchema = {
  id: 'string',
  name: 'string',
  type: 'attendance|booking|visitor|asset|financial|compliance',
  parameters: 'object',
  generatedBy: 'string',
  generatedAt: 'datetime',
  filePath: 'string',
  format: 'pdf|excel|csv',
  recipients: 'array',
  isScheduled: 'boolean',
  schedulePattern: 'string',
  nextRun: 'datetime',
  status: 'generated|failed|scheduled',
  createdAt: 'date'
};

module.exports = {
  employeeSchema,
  buildingSchema,
  floorSchema,
  roomSchema,
  bookingSchema,
  visitorSchema,
  assetSchema,
  attendanceSchema,
  leaveSchema,
  departmentSchema,
  notificationSchema,
  reportSchema
};
