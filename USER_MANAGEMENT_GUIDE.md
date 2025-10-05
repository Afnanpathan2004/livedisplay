# User Management System Guide

## Overview
The User Management System provides complete control over who can access your LiveDisplay application and what permissions they have. As an admin, you can create users, assign roles, approve registrations, and manage access levels.

## Table of Contents
1. [Roles & Permissions](#roles--permissions)
2. [Accessing User Management](#accessing-user-management)
3. [Managing Users](#managing-users)
4. [User Approval Workflow](#user-approval-workflow)
5. [Security Best Practices](#security-best-practices)

---

## Roles & Permissions

### Available Roles

#### 1. **Admin** (Full System Access)
- **Color Badge**: Red
- **Description**: Complete system control
- **Permissions**:
  - All access
  - User management
  - Settings management
  - Reports & analytics
  - Schedule management
  - Employee management
  - Room bookings
  - Asset management
  - Can create/edit/delete other users
  - Can approve/reject user registrations

#### 2. **HR Manager** (Human Resources)
- **Color Badge**: Blue
- **Description**: Employee & leave management
- **Permissions**:
  - Employee management
  - Leave management
  - Attendance tracking
  - Reports & analytics
  - Schedule management
  - Room bookings
  - Settings management (limited)

#### 3. **Manager** (Team Management)
- **Color Badge**: Purple
- **Description**: Team management & reports
- **Permissions**:
  - Team management
  - Reports & analytics
  - Schedule management
  - Room bookings
  - Attendance tracking

#### 4. **Editor** (Content Management)
- **Color Badge**: Green
- **Description**: Create & edit content
- **Permissions**:
  - Schedule management
  - Announcements
  - Tasks management
  - Room bookings

#### 5. **Viewer** (Read-Only Access)
- **Color Badge**: Gray
- **Description**: View-only access
- **Permissions**:
  - View schedules
  - View announcements
  - View tasks
  - No editing capabilities

---

## Accessing User Management

### For Admin Users:
1. Log in with admin credentials
2. Click **"User Management"** in the sidebar navigation
3. The User Management dashboard will display

### Default Admin Account:
```
Username: admin
Email: admin@liveboard.com
Password: admin123
Role: admin
```

**⚠️ IMPORTANT**: Change the default admin password immediately after first login!

---

## Managing Users

### Dashboard Overview

The User Management dashboard shows:
- **Total Users**: All registered users
- **Active Users**: Currently active accounts
- **Pending Users**: Awaiting approval
- **Admin Count**: Number of administrators

### Adding a New User

1. **Click "Add User" Button**
   - Located in the top-right corner

2. **Fill in User Details**:
   - **Email*** (required): User's email address
   - **Username*** (required): Unique username for login
   - **First Name*** (required): User's first name
   - **Last Name*** (required): User's last name
   - **Password*** (required): Minimum 6 characters
   - **Role*** (required): Select from dropdown
     - Admin
     - HR Manager
     - Manager
     - Editor
     - Viewer

3. **Review Permissions**:
   - The form displays permissions for the selected role
   - Verify the role matches intended access level

4. **Click "Add User"**:
   - User is created immediately
   - Status is set to "active" by default
   - User can log in immediately

### Editing an Existing User

1. **Find the User**:
   - Use search bar to find by name, email, or username
   - Or filter by role/status

2. **Click Edit Icon** (pencil):
   - Opens edit modal

3. **Update Details**:
   - Modify email, username, name, or role
   - Cannot change password (user must reset)

4. **Save Changes**:
   - Click "Update User"
   - Changes apply immediately

### Activating/Deactivating Users

**To Deactivate**:
1. Click the **UserX icon** (person with X)
2. User status changes to "inactive"
3. User cannot log in

**To Reactivate**:
1. Click the **UserCheck icon** (person with checkmark)
2. User status changes to "active"
3. User can log in again

### Deleting Users

1. **Click Delete Icon** (trash)
2. **Confirm Deletion**:
   - Warning: This action cannot be undone
   - All user data will be removed
3. **Cannot Delete**:
   - Your own admin account
   - Must have at least one admin

---

## User Approval Workflow

### Self-Registration Process

When users register themselves:
1. User fills registration form
2. Account created with **"pending"** status
3. User cannot log in until approved
4. Admin receives notification (if configured)

### Approving Users

1. **Navigate to User Management**
2. **Filter by Status**: Select "Pending"
3. **Review User Details**:
   - Check email domain
   - Verify name and information
4. **Click "Approve"**:
   - User status changes to "active"
   - User receives approval notification
   - User can now log in

### Rejecting Users

1. **Click "Reject"** on pending user
2. **Provide Reason**:
   - Enter rejection reason in prompt
   - Reason is saved for audit
3. **User Notified**:
   - User receives rejection notification
   - Cannot log in
   - Can re-register if needed

---

## Filtering & Searching

### Search Bar
Search users by:
- Email address
- Username
- First name
- Last name

### Role Filter
Filter users by role:
- All Roles
- Admin
- HR Manager
- Manager
- Editor
- Viewer

### Status Filter
Filter users by status:
- All Status
- Active
- Inactive
- Pending
- Rejected

---

## User Status Types

### Active
- ✅ Can log in
- ✅ Full access to assigned permissions
- ✅ Appears in user lists

### Inactive
- ❌ Cannot log in
- ❌ No system access
- ✅ Data preserved
- ✅ Can be reactivated

### Pending
- ❌ Cannot log in
- ⏳ Awaiting admin approval
- ✅ Can be approved or rejected

### Rejected
- ❌ Cannot log in
- ❌ Registration denied
- ✅ Reason recorded
- ✅ Can re-register

---

## Security Best Practices

### 1. **Password Management**
- Require strong passwords (minimum 6 characters)
- Change default admin password immediately
- Regularly update admin passwords
- Never share admin credentials

### 2. **Role Assignment**
- Follow principle of least privilege
- Only assign admin role when necessary
- Review user roles quarterly
- Remove access when no longer needed

### 3. **User Monitoring**
- Regularly review active users
- Check for inactive accounts
- Monitor last login dates
- Deactivate unused accounts

### 4. **Approval Process**
- Verify email domains before approval
- Confirm user identity when possible
- Document rejection reasons
- Keep audit trail

### 5. **Access Control**
- Limit number of admin accounts
- Use HR role for employee management
- Use Manager role for team leads
- Use Viewer for read-only access

---

## API Endpoints

### User Management APIs

```http
# Get all users (Admin only)
GET /api/users
Authorization: Bearer <token>

# Get user by ID
GET /api/users/:id
Authorization: Bearer <token>

# Create new user (Admin only)
POST /api/users
Authorization: Bearer <token>
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "admin|hr|manager|editor|viewer",
  "status": "active|inactive|pending"
}

# Update user (Admin only)
PUT /api/users/:id
Authorization: Bearer <token>
Body: {
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string"
}

# Update user status (Admin only)
PATCH /api/users/:id/status
Authorization: Bearer <token>
Body: { "status": "active|inactive|pending|rejected" }

# Approve user (Admin only)
POST /api/users/:id/approve
Authorization: Bearer <token>

# Reject user (Admin only)
POST /api/users/:id/reject
Authorization: Bearer <token>
Body: { "reason": "string" }

# Delete user (Admin only)
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## Troubleshooting

### Cannot Access User Management
- **Solution**: Verify you're logged in as admin
- Only admin role can access user management

### Cannot Create User
- **Check**: Username/email already exists
- **Check**: All required fields filled
- **Check**: Password meets minimum length

### User Cannot Log In
- **Check**: User status is "active"
- **Check**: Username/password correct
- **Check**: Account not deleted

### Cannot Delete User
- **Check**: Not trying to delete own account
- **Check**: Have admin permissions
- **Check**: User exists in system

---

## Keyboard Shortcuts

- **Search**: Click search box or use Tab to navigate
- **Enter**: Submit forms
- **Escape**: Close modals

---

## Best Practices for Different Scenarios

### Educational Institution
- **Admin**: IT Department
- **HR**: Administrative Staff
- **Manager**: Department Heads
- **Editor**: Faculty Members
- **Viewer**: Students

### Corporate Office
- **Admin**: IT/System Administrators
- **HR**: Human Resources Team
- **Manager**: Team Leads/Supervisors
- **Editor**: Content Creators
- **Viewer**: General Employees

### Small Business
- **Admin**: Owner/Manager
- **Editor**: Staff Members
- **Viewer**: Part-time/Contractors

---

## Frequently Asked Questions

### Q: Can users change their own role?
**A**: No, only admins can change user roles.

### Q: What happens to user data when deleted?
**A**: All user data is permanently removed. Use "inactive" status to preserve data.

### Q: Can I have multiple admins?
**A**: Yes, you can create multiple admin accounts.

### Q: How do I reset a user's password?
**A**: Currently, users must use password reset feature. Admins can create new account with new password.

### Q: Can I bulk import users?
**A**: Not currently available. Users must be added individually or via API.

### Q: Are user actions logged?
**A**: Yes, user creation, updates, and deletions are logged with timestamps.

---

## Support

For additional help or questions:
1. Check this documentation
2. Review API documentation
3. Contact system administrator
4. Check application logs for errors

---

## Version History

- **v1.0** - Initial User Management System
  - User CRUD operations
  - Role-based access control
  - User approval workflow
  - Status management
  - Search and filtering

---

**Last Updated**: 2025-10-05
**Document Version**: 1.0
