# FitFaat Admin Portal

A web-based admin portal for managing users and doctors in the FitFaat application.

## Features

### 👥 Normal Users Management
- View all registered users
- Search users by email or username
- View detailed user information
- Monitor user status (Active/Inactive)
- See user registration dates

### 👨‍⚕️ Doctors Management
- View all doctor applications
- Filter doctors by status (Pending, Approved, Rejected, Suspended)
- Search doctors by name or email
- View comprehensive doctor information including:
  - Personal details
  - Professional qualifications
  - License information
  - Clinic details
  - Verification status
- **Approve pending doctor applications**
- **Reject doctor applications with notes**

## Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: CSS3

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Backend API running on `http://localhost:5001`

### Setup

1. Navigate to the admin-portal directory:
```bash
cd admin-portal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
VITE_API_URL=http://localhost:5001/api
```

## Development

Start the development server:

```bash
npm run dev
```

The admin portal will be available at `http://localhost:3000`

## Building for Production

Build the project:

```bash
npm run build
```

The compiled files will be in the `dist` folder.

Preview the production build:

```bash
npm run preview
```

## Usage

### Login
1. Open the admin portal in your browser
2. Enter your admin email/username and password
3. You must have admin privileges to access the portal

### Managing Users
1. Click on "👥 Normal Users" tab
2. Use the search bar to find specific users
3. Click "View Details" to see full user information

### Managing Doctors
1. Click on "👨‍⚕️ Doctors" tab
2. Filter by status using the dropdown menu
3. Use the search bar to find specific doctors
4. Click "View Details" to see comprehensive information
5. For pending applications:
   - Click "✓ Approve" to verify and approve the doctor
   - Click "✕ Reject" to deny the application

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/admin/verify` - Verify admin token

### Users
- `GET /api/admin/users` - Get all users

### Doctors
- `GET /api/admin/doctors` - Get all doctors
- `PUT /api/admin/doctors/{id}/approve` - Approve a doctor
- `PUT /api/admin/doctors/{id}/reject` - Reject a doctor

## Project Structure

```
admin-portal/
├── index.html           # Main HTML file
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # Main app component
    ├── App.css          # Global styles
    ├── pages/
    │   ├── LoginPage.jsx      # Login page component
    │   ├── LoginPage.css       # Login page styles
    │   ├── DashboardPage.jsx   # Dashboard component
    │   └── DashboardPage.css   # Dashboard styles
    └── components/
        ├── UsersList.jsx       # Users list component
        ├── UsersList.css       # Users list styles
        ├── DoctorsList.jsx      # Doctors list component
        └── DoctorsList.css      # Doctors list styles
```

## Security Notes

- Admin tokens are stored in localStorage
- Ensure HTTPS is used in production
- Implement proper CORS policies on your backend
- Never commit `.env` files with sensitive data

## Future Enhancements

- [ ] Export users/doctors to CSV/PDF
- [ ] Advanced filtering and sorting options
- [ ] User/Doctor activity logs
- [ ] Bulk actions
- [ ] Analytics dashboard
- [ ] Email notifications for approvals/rejections
- [ ] Backup and restore functionality
- [ ] Admin activity audit trail

## Support

For issues or questions, please contact the development team.

## License

All rights reserved © 2025 FitFaat
