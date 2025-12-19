# Database Schema Documentation

## Overview

The Nio Dashboard uses PostgreSQL (Neon) with four main tables to manage users, modules, charts, and access control.

## Tables

### 1. users

Stores user account information and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| username | VARCHAR(255) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(50) | DEFAULT 'user' | User role (admin/user) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |

**Constraints:**
- `role` must be either 'admin' or 'user'

**Example:**
```sql
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$hashedpassword', 'admin');
```

---

### 2. modules

Defines available modules in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique module identifier |
| name | VARCHAR(100) | NOT NULL | Display name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| icon | VARCHAR(100) | | Lucide icon name |

**Pre-seeded Data:**
- Project Management (slug: `pm`, icon: `Briefcase`)
- Sales (slug: `sales`, icon: `TrendingUp`)
- Human Resources (slug: `hr`, icon: `Users`)

**Example:**
```sql
INSERT INTO modules (name, slug, icon)
VALUES ('Marketing', 'marketing', 'Megaphone');
```

---

### 3. charts

Stores Looker Studio chart embed information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique chart identifier |
| module_id | INTEGER | FOREIGN KEY → modules(id) | Parent module |
| title | VARCHAR(255) | NOT NULL | Chart title |
| embed_url | TEXT | NOT NULL | Looker Studio embed URL |
| is_visible | BOOLEAN | DEFAULT TRUE | Visibility to users |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Relationships:**
- `module_id` references `modules(id)` with CASCADE delete

**Example:**
```sql
INSERT INTO charts (module_id, title, embed_url, is_visible)
VALUES (1, 'Monthly Performance', 'https://lookerstudio.google.com/embed/reporting/...', true);
```

---

### 4. user_module_access

Junction table for per-user module permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique access record |
| user_id | INTEGER | FOREIGN KEY → users(id) | User being granted access |
| module_id | INTEGER | FOREIGN KEY → modules(id) | Module being accessed |
| granted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Permission grant time |

**Constraints:**
- UNIQUE constraint on (user_id, module_id) - prevents duplicate permissions

**Relationships:**
- `user_id` references `users(id)` with CASCADE delete
- `module_id` references `modules(id)` with CASCADE delete

**Access Logic:**
- **Admin users**: Have access to ALL modules (not stored in this table)
- **Regular users**: Only see modules listed in this table

**Example:**
```sql
-- Grant user ID 5 access to PM module (ID 1)
INSERT INTO user_module_access (user_id, module_id)
VALUES (5, 1);
```

---

---

### 5. module_messages

Stores chat messages for each module.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique message identifier |
| module_id | INTEGER | FOREIGN KEY → modules(id) | Module where message was posted |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who posted the message |
| message | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Post time |

**Relationships:**
- `module_id` references `modules(id)` with CASCADE delete
- `user_id` references `users(id)` with CASCADE delete

**Example:**
```sql
INSERT INTO module_messages (module_id, user_id, message)
VALUES (1, 5, 'Has anyone checked the latest reports?');
```

---

## Relationships Diagram

```
users (1) ──────< (N) user_module_access (N) >────── (1) modules
                                                           │
                                                           │
                                                          (1)
                                                           │
                                                           ▼
                                                          (N)
                                                        charts
```

---

## Common Queries

### Get all modules for a user

```sql
-- For regular users
SELECT m.* 
FROM modules m
INNER JOIN user_module_access uma ON m.id = uma.module_id
WHERE uma.user_id = $1;

-- For admins (all modules)
SELECT * FROM modules;
```

### Get visible charts for a module

```sql
-- For regular users
SELECT * FROM charts 
WHERE module_id = $1 AND is_visible = true;

-- For admins (all charts)
SELECT * FROM charts 
WHERE module_id = $1;
```

### Grant module access to user

```sql
INSERT INTO user_module_access (user_id, module_id)
VALUES ($1, $2)
ON CONFLICT (user_id, module_id) DO NOTHING;
```

### Revoke all module access for user

```sql
DELETE FROM user_module_access WHERE user_id = $1;
```

---

## Security Considerations

1. **Password Storage**: Always use bcrypt with salt rounds ≥ 10
2. **Role Validation**: Enforce role checks in application logic
3. **Cascade Deletes**: Deleting a user removes their module access
4. **Admin Access**: Admins bypass module access checks in application

---

## Migration Notes

To apply this schema to your Neon PostgreSQL database:

```bash
psql -h <neon-host> -U <username> -d <database> -f server/db/schema.sql
```

Or use the Neon SQL Editor to paste and execute the contents of `server/db/schema.sql`.
