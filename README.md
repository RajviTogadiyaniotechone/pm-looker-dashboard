# Nio Dashboard

A modern, responsive web application dashboard for managing and visualizing data from Google Looker Studio. Built with React, Node.js, Express, and PostgreSQL.

## Features

- 🔐 **Secure Authentication** - JWT-based login system
- 👥 **User Management** - Admin can create and manage user accounts
- 🎯 **Module-Based Access Control** - Admins assign specific modules to users
- 📊 **Looker Studio Integration** - Embed and display charts via iframes
- 👁️ **Chart Visibility Control** - Admins can hide/show charts from users
- 🎨 **Beautiful UI** - Light theme with glassmorphism and gradient effects
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

**Frontend:**
- React 18 with Vite
- Axios for API calls
- Lucide React for icons
- Vanilla CSS with CSS variables

**Backend:**
- Node.js with Express
- PostgreSQL (Neon)
- JWT authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (Neon recommended)
- npm or yarn

## Installation

### 1. Clone or Navigate to Project

```bash
cd d:/Rajvi_python/PM_Looker/Dashboard
```

### 2. Setup Database

1. Create a PostgreSQL database on [Neon](https://neon.tech) or your preferred provider
2. Run the schema file to create tables:

```bash
psql -h <your-host> -U <your-username> -d <your-database> -f server/db/schema.sql
```

Or copy the contents of `server/db/schema.sql` and run it in your database client.

### 3. Configure Backend

1. Navigate to server directory:
```bash
cd server
```

2. Copy environment file:
```bash
copy .env.example .env
```

3. Edit `.env` and add your database connection string:
```
PORT=5000
DATABASE_URL=postgresql://username:password@host/database
NODE_ENV=development
JWT_SECRET=your_secret_key_here_change_this
```

4. Install dependencies:
```bash
npm install
```

### 4. Configure Frontend

1. Navigate to client directory:
```bash
cd ../client
```

2. Install dependencies:
```bash
npm install
```

The `.env` file is already created with default settings. Modify if needed.

## Running the Application

### Start Backend Server

```bash
cd server
node index.js
```

Server will run on `http://localhost:5000`

### Start Frontend Development Server

Open a new terminal:

```bash
cd client
npm run dev
```

Frontend will run on `http://localhost:5173`

## Initial Setup

### Create First Admin User

Since there are no users initially, you need to create the first admin user directly in the database:

```sql
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'admin');
```

To generate a bcrypt hash for your password, you can use an online tool or run this in Node.js:

```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('your_password', 10));
```

**Default credentials for testing:**
- Username: `admin`
- Password: `admin123`

Hash for `admin123`: `$2a$10$rOZJe8K8xN0Y0YqN0Y0Y0uN0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y`

### Add Sample Charts

After logging in as admin, you can add charts via the database:

```sql
-- Get the PM module ID
SELECT id FROM modules WHERE slug = 'pm';

-- Add a chart (replace module_id and embed_url)
INSERT INTO charts (module_id, title, embed_url, is_visible)
VALUES (1, 'Project Overview', 'https://lookerstudio.google.com/embed/your-report-id', true);
```

## Usage Guide

### For Admins

1. **Login** with admin credentials
2. **Access Admin Panel** from the sidebar
3. **Create Users:**
   - Click "Create User"
   - Enter username, password, and role
   - Click "Create"
4. **Manage Module Access:**
   - Select a user from the list
   - Check/uncheck modules to grant/revoke access
   - Click "Save Changes"
5. **Control Chart Visibility:**
   - Navigate to any module
   - Click the eye icon on charts to hide/show from users

### For Users

1. **Login** with provided credentials
2. **View Modules** - Only assigned modules appear in sidebar
3. **View Charts** - Only visible charts are displayed
4. **Analyze Data** - Interact with embedded Looker Studio charts

## Database Schema

See `DATABASE.md` for detailed schema documentation.

### Key Tables

- `users` - User accounts and roles
- `modules` - Available modules (PM, Sales, HR)
- `charts` - Looker Studio chart embeds
- `user_module_access` - Per-user module permissions

## Project Structure

```
Dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Login, Dashboard
│   │   └── index.css      # Global styles
│   └── .env               # Frontend config
│
└── server/                # Express backend
    ├── db/                # Database files
    ├── middleware/        # Auth middleware
    ├── routes/            # API routes
    ├── index.js           # Server entry
    └── .env               # Backend config
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/modules` - Get user's modules
- `POST /api/users/:id/modules` - Set user's modules

### Modules
- `GET /api/modules` - Get accessible modules
- `GET /api/modules/all` - Get all modules (admin)

### Charts
- `GET /api/charts/module/:slug` - Get charts for module
- `PATCH /api/charts/:id/visibility` - Toggle visibility (admin)
- `POST /api/charts` - Create chart (admin)
- `DELETE /api/charts/:id` - Delete chart (admin)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `server/.env`
- Check if database is accessible
- Ensure schema is properly created

### CORS Errors
- Backend must be running on port 5000
- Frontend must be running on port 5173
- Check CORS configuration in `server/index.js`

### Login Issues
- Verify user exists in database
- Check password hash is correct
- Ensure JWT_SECRET is set in `.env`

## Future Enhancements

- Email notifications
- Activity logs
- Chart analytics
- Export functionality
- Dark mode toggle
- Mobile app

## License

MIT

## Support

For issues or questions, contact the development team.
