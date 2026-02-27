# Admin Portal Setup Guide

## Overview
The admin portal provides comprehensive management capabilities for the EGreet application, including:
- View all card data and user information
- Delete individual cards
- View statistics and analytics
- Search and filter functionality

## Access Control

### Admin Authentication
The admin portal uses email-based authentication. To configure admin access:

1. **Update Admin Emails** in `src/contexts/AdminAuthContext.jsx`:
   ```javascript
   const ADMIN_EMAILS = [
     'admin@egreet.com',
     'your-email@example.com' // Replace with your actual admin email
   ];
   ```

2. **For Production**: Consider using environment variables:
   ```javascript
   const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean);
   ```

### Access URL
- Navigate to `/admin` to access the admin dashboard
- Users must be logged in and have admin email to access

## Features

### Dashboard Overview
- **Total Users**: Count of all registered users
- **Total Cards**: Count of all created cards
- **Weekly Growth**: New users and cards created in the last 7 days
- **Popular Card Types**: Top 5 most used card types

### Card Management
- **View All Cards**: Paginated list showing card details
- **Search**: Search by card ID, type, or recipient name
- **Filter**: Filter by card type
- **Delete**: Remove individual cards with confirmation

### Data Display
For each card, the dashboard shows:
- Card ID
- Card type
- Recipient name
- Creation date
- User ID (truncated)
- Delete action

## Security Considerations

### Current Implementation
- Email-based access control
- Client-side admin check
- Firebase security rules needed for production

### Production Recommendations
1. **Server-side validation**: Implement admin verification in backend
2. **Environment variables**: Store admin emails securely
3. **Audit logging**: Track admin actions
4. **Rate limiting**: Prevent abuse of delete operations
5. **Firebase Security Rules**: Restrict admin operations to authorized users

## Firebase Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email in ['admin@egreet.com', 'your-email@example.com'];
    }
    
    // Regular users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cards can be read by anyone, but only deleted by admins
    match /cards/{cardId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.token.email in ['admin@egreet.com', 'your-email@example.com'];
      allow update: if request.auth != null && 
        (request.auth.token.email in ['admin@egreet.com', 'your-email@example.com'] ||
         resource.data.userId == request.auth.uid);
    }
  }
}
```

## Usage Instructions

1. **Login** with your admin email account
2. **Navigate** to `/admin`
3. **View Dashboard** for overview statistics
4. **Search/Filter** cards using the controls
5. **Delete Cards** by clicking the trash icon
6. **Refresh** data using the refresh button

## Customization

### Adding New Admin Features
1. Update `AdminDashboard.jsx` to add new sections
2. Add corresponding CSS in `AdminDashboard.css`
3. Update Firebase queries as needed

### Modifying Permissions
1. Update `ADMIN_EMAILS` array in `AdminAuthContext.jsx`
2. Modify Firebase security rules accordingly
3. Test access control thoroughly

## Troubleshooting

### Access Denied
- Verify your email is in the `ADMIN_EMAILS` array
- Ensure you're logged in with the correct account
- Check browser console for authentication errors

### Data Not Loading
- Verify Firebase configuration in `.env` file
- Check Firestore database permissions
- Ensure user has proper read permissions

### Delete Not Working
- Verify Firebase security rules allow deletion
- Check browser console for permission errors
- Ensure admin email is correctly configured

## Performance Considerations

- The dashboard loads up to 100 cards and 50 users initially
- Consider implementing pagination for larger datasets
- Add caching for frequently accessed statistics
- Monitor Firestore read operations for cost optimization
