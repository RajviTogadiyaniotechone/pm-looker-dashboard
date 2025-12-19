# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Setup Database

1. Create a free PostgreSQL database at [Neon](https://neon.tech)
2. Copy your connection string
3. Run the schema:
   - Open Neon SQL Editor
   - Copy contents from `server/db/schema.sql`
   - Execute

### 2. Configure & Install

**Backend:**
```bash
cd server
copy .env.example .env
# Edit .env and add your DATABASE_URL
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Create Admin User

Run this SQL in Neon:

```sql
-- Password: admin123
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$10$rOZJe8K8xN0Y0YqN0Y0Y0uN0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y', 'admin');
```

### 4. Run Application

**Terminal 1 - Backend:**
```bash
cd server
node index.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Login & Setup

1. Open `http://localhost:5173`
2. Login: `admin` / `admin123`
3. Go to Admin Panel
4. Create users and assign modules

## 📊 Adding Looker Studio Charts

1. Get your Looker Studio embed URL
2. Run this SQL (replace values):

```sql
INSERT INTO charts (module_id, title, embed_url)
VALUES (1, 'Your Chart Title', 'https://lookerstudio.google.com/embed/...');
```

## 🎯 Module Access

- **Admins**: See all modules automatically
- **Users**: Only see assigned modules

To assign modules to a user:
1. Login as admin
2. Admin Panel → Select user
3. Check modules → Save

## 💬 Module Chat

Each module has a dedicated chat room:
- **Users**: Can read and post messages in modules they have access to.
- **Admins**: Can read, post, and **delete** messages in any module.
- **Features**: Real-time updates (auto-refresh), glassmorphism UI, collapsible panel.


## 📝 Environment Variables

**server/.env:**
```
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=change_this_secret
PORT=5000
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000/api
```

## ❓ Troubleshooting

**Can't login?**
- Check database connection
- Verify user exists in `users` table

**Charts not showing?**
- Check `is_visible = true` in database
- Verify user has module access

**CORS errors?**
- Ensure backend runs on port 5000
- Ensure frontend runs on port 5173

For detailed documentation, see `README.md`.
