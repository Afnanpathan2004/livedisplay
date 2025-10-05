# Settings Management Guide

## Overview
The Settings Management feature allows administrators to manage all dropdown options used throughout the LiveDisplay application. This eliminates hardcoded values and provides a centralized interface for managing:

- **Rooms**: Room numbers and names for scheduling
- **Subjects**: Course subjects and topics
- **Faculties**: Faculty/instructor names
- **Departments**: Organization departments
- **Positions**: Job positions and titles
- **Locations**: Building locations and floors
- **Amenities**: Room amenities and facilities
- **Companies**: Visitor company names
- **Visit Purposes**: Reasons for visitor visits

## Accessing Settings Management

### For Admin/HR Users:
1. Log in to the application
2. Navigate to **Settings** from the sidebar menu
3. The Settings Management page will display all available categories

## Features

### 1. **Category Management**
- View all settings categories in the left sidebar
- Click on any category to view and manage its items
- Each category shows:
  - Icon representation
  - Category name
  - Description
  - Total item count

### 2. **Adding New Items**
1. Select a category from the sidebar
2. Click the **"Add New"** button
3. Enter the item name in the input field
4. Press **Enter** or click **"Save"**
5. The item will be immediately available in all dropdowns

### 3. **Editing Items**
1. Click the **Edit** icon (pencil) next to any item
2. Modify the text in the input field
3. Press **Enter** or click outside to save
4. Click the **X** icon to cancel editing

### 4. **Deleting Items**
1. Click the **Delete** icon (trash) next to any item
2. Confirm the deletion in the popup dialog
3. The item will be removed from all dropdowns

## How It Works

### Backend (Server)
- **API Endpoints**: `/api/settings`
- **Storage**: In-memory storage (persists during server runtime)
- **Default Values**: Automatically initialized on first access
- **Authentication**: Requires valid JWT token

### Frontend (Client)
- **Component**: `SettingsManagement.jsx`
- **Route**: `/settings`
- **Access**: Admin and HR roles only
- **Real-time Updates**: Changes reflect immediately

### Integration with Admin Page
The Admin page (`Admin.jsx`) automatically loads settings on mount:
- Fetches all dropdown options from the settings API
- Falls back to default values if API fails
- All form dropdowns use these dynamic values

## API Endpoints

### Get All Settings
```
GET /api/settings
Authorization: Bearer <token>

Response: {
  rooms: [...],
  subjects: [...],
  faculties: [...],
  ...
}
```

### Get Category
```
GET /api/settings/:category
Authorization: Bearer <token>

Response: {
  category: "rooms",
  items: [...]
}
```

### Update Category
```
PUT /api/settings/:category
Authorization: Bearer <token>
Body: { items: [...] }

Response: {
  message: "Settings updated successfully",
  category: "rooms",
  items: [...]
}
```

### Add Item
```
POST /api/settings/:category/items
Authorization: Bearer <token>
Body: { item: "New Room 301" }

Response: {
  message: "Item added successfully",
  category: "rooms",
  item: "New Room 301",
  items: [...]
}
```

### Remove Item
```
DELETE /api/settings/:category/items/:item
Authorization: Bearer <token>

Response: {
  message: "Item removed successfully",
  category: "rooms",
  items: [...]
}
```

## Usage Examples

### Example 1: Adding a New Room
1. Navigate to Settings → Rooms
2. Click "Add New"
3. Type "Conference Room C"
4. Press Enter
5. The room is now available in schedule forms

### Example 2: Managing Faculty Names
1. Navigate to Settings → Faculties
2. View all existing faculty names
3. Edit any name by clicking the pencil icon
4. Delete outdated entries with the trash icon
5. Add new faculty members as needed

### Example 3: Customizing Departments
1. Navigate to Settings → Departments
2. Add your organization's specific departments
3. Remove any departments you don't use
4. Changes apply to employee forms immediately

## Best Practices

1. **Regular Maintenance**: Review and update settings periodically
2. **Consistent Naming**: Use clear, consistent naming conventions
3. **Avoid Duplicates**: Check for existing items before adding new ones
4. **Test Changes**: Verify changes in forms after updating settings
5. **Backup Important Data**: Keep a record of critical settings

## Troubleshooting

### Settings Not Loading
- Check if the server is running
- Verify authentication token is valid
- Check browser console for errors
- Ensure you have admin/HR role

### Changes Not Reflecting
- Refresh the page
- Clear browser cache
- Check if the API call succeeded
- Verify the correct category was updated

### Cannot Delete Item
- Ensure you have proper permissions
- Check if the item is in use
- Confirm the deletion dialog

## Technical Details

### File Locations
- **Frontend Component**: `client/src/components/SettingsManagement.jsx`
- **Backend Controller**: `server/src/controllers/settingsController.js`
- **API Service**: `client/src/services/api.js`
- **Server Routes**: `server/src/bulletproof-server.js`
- **Database Utility**: `server/src/utils/enterpriseDb.js`

### Dependencies
- React (Frontend)
- Lucide Icons (UI Icons)
- Express (Backend)
- JWT (Authentication)

## Future Enhancements
- Export/Import settings as JSON
- Bulk operations (add/delete multiple items)
- Settings history and audit log
- Role-based category access control
- Custom category creation
- Settings templates for different organizations

## Support
For issues or questions, please contact your system administrator or refer to the main application documentation.
