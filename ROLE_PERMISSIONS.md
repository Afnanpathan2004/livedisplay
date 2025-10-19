# Role-Based Access Control (RBAC)

## Overview
The LiveDisplay application uses role-based access control to restrict features based on user roles.

---

## Available Roles

### 1. **Admin** (Full Access)
**Description**: System administrator with complete control

**Permissions**:
- ✅ **User Management** - Create, edit, delete, approve/reject users
- ✅ **Settings Management** - Manage dropdown options (rooms, subjects, faculties, etc.)
- ✅ **Admin Panel** - Full schedule and content management
- ✅ **Dashboard** - View LiveBoard dashboard
- ✅ **Display** - View public display

**Access to**:
- `/users` - User Management page
- `/settings` - Settings Management page
- `/admin` - Admin Panel
- `/dashboard` - Dashboard
- `/display` - Public Display

---

### 2. **HR Manager**
**Description**: Human resources management

**Permissions**:
- ❌ User Management (No access)
- ✅ **Settings Management** - Manage dropdown options
- ✅ **Admin Panel** - Schedule and content management
- ✅ **Dashboard** - View LiveBoard dashboard
- ✅ **Display** - View public display

**Access to**:
- `/settings` - Settings Management page
- `/admin` - Admin Panel
- `/dashboard` - Dashboard
- `/display` - Public Display

**Restricted from**:
- `/users` - User Management (Admin only)

---

### 3. **Manager**
**Description**: Team management and reporting

**Permissions**:
- ❌ User Management (No access)
- ❌ Settings Management (No access)
- ✅ **Admin Panel** - Schedule and content management
- ✅ **Dashboard** - View LiveBoard dashboard
- ✅ **Display** - View public display

**Access to**:
- `/admin` - Admin Panel
- `/dashboard` - Dashboard
- `/display` - Public Display

**Restricted from**:
- `/users` - User Management (Admin only)
- `/settings` - Settings Management (Admin/HR only)

---

### 4. **Editor**
**Description**: Content creation and editing

**Permissions**:
- ❌ User Management (No access)
- ❌ Settings Management (No access)
- ✅ **Admin Panel** - Schedule and content management
- ✅ **Dashboard** - View LiveBoard dashboard
- ✅ **Display** - View public display

**Access to**:
- `/admin` - Admin Panel
- `/dashboard` - Dashboard
- `/display` - Public Display

**Restricted from**:
- `/users` - User Management (Admin only)
- `/settings` - Settings Management (Admin/HR only)

---

### 5. **Viewer**
**Description**: Read-only access

**Permissions**:
- ❌ User Management (No access)
- ❌ Settings Management (No access)
- ❌ Admin Panel (No access)
- ✅ **Dashboard** - View LiveBoard dashboard
- ✅ **Display** - View public display

**Access to**:
- `/dashboard` - Dashboard (read-only)
- `/display` - Public Display

**Restricted from**:
- `/users` - User Management (Admin only)
- `/settings` - Settings Management (Admin/HR only)
- `/admin` - Admin Panel (No editing rights)

---

## Permission Matrix

| Feature | Admin | HR | Manager | Editor | Viewer |
|---------|-------|-----|---------|--------|--------|
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings Management** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin Panel** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Display View** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Implementation Details

### Frontend (UI Level)
- **Admin Panel** (`/admin`): Shows "User Management" button only if `user.role === 'admin'`
- **Dashboard** (`/dashboard`): Shows "User Management" button only if `user.role === 'admin'`
- **Settings** button: Shows only if `user.role === 'admin' || user.role === 'hr'`

### Backend (API Level)
All User Management endpoints require `role === 'admin'`:
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `POST /api/users/:id/approve` - Approve user
- `POST /api/users/:id/reject` - Reject user
- `DELETE /api/users/:id` - Delete user

**Response for unauthorized access**:
```json
{
  "error": "Access denied. Admin only."
}
```
Status Code: `403 Forbidden`

---

## Default Admin Account

**Credentials**:
```
Username: afnan
Password: afnan711
Email: afnan@liveboard.com
Role: admin
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## How to Assign Roles

### When Creating a User (Admin only):
1. Log in as admin
2. Go to User Management (`/users`)
3. Click "Add User"
4. Select role from dropdown:
   - Admin
   - HR Manager
   - Manager
   - Editor
   - Viewer
5. Fill in other details
6. Click "Add User"

### When Editing a User (Admin only):
1. Go to User Management
2. Click edit icon on user card
3. Change role in dropdown
4. Click "Update User"

---

## Security Notes

1. **Admin Role**: Only assign to trusted personnel who need full system access
2. **HR Role**: For HR department staff who need to manage settings
3. **Manager Role**: For team leads who need content management
4. **Editor Role**: For content creators
5. **Viewer Role**: For users who only need to view information

---

## Testing Role Permissions

### To Test Admin Access:
1. Log in as admin (afnan/afnan711)
2. You should see "User Management" button in top nav
3. Click it - you should access the page successfully

### To Test HR Access:
1. Create an HR user
2. Log in with HR credentials
3. You should see "Settings" button but NOT "User Management"
4. Try accessing `/users` directly - should get "Access denied"

### To Test Manager/Editor Access:
1. Create a Manager or Editor user
2. Log in with their credentials
3. Should NOT see "User Management" or "Settings" buttons
4. Try accessing `/users` or `/settings` directly - should get "Access denied"

### To Test Viewer Access:
1. Create a Viewer user
2. Log in with their credentials
3. Should only see "Dashboard" and "View Display"
4. No access to admin features

---

## Troubleshooting

### "Access denied" error when accessing User Management
- **Cause**: User does not have admin role
- **Solution**: Log in with admin account or have an admin change your role

### User Management button not visible
- **Cause**: User role is not 'admin'
- **Solution**: Only admin users can see this button

### Settings button not visible
- **Cause**: User role is not 'admin' or 'hr'
- **Solution**: Only admin and HR users can see this button

---

## Version History

- **v2.0** - Implemented proper role-based access control
  - Admin-only access to User Management
  - Admin/HR access to Settings
  - Frontend and backend enforcement
  - Clear permission matrix

---

**Last Updated**: 2025-10-05
**Document Version**: 2.0
