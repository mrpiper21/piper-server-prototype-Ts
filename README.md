# Printer Management System API

A comprehensive backend API for the Printer Management System with user authentication, role-based access control, and printer management capabilities.

## Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** with granular permissions
- **User management** with CRUD operations
- **Password hashing** with bcrypt
- **Input validation** with express-validator

### 👥 User Roles & Permissions
- **Admin**: Full system access, user management, analytics
- **Manager**: Analytics, reports, agent management
- **Clerk**: Job management, print submission, agent monitoring
- **Technician**: Printer maintenance, log viewing
- **Customer**: Job submission, own job viewing

### 🖨️ Printer Management
- **File upload** and processing
- **Print job management**
- **Agent monitoring**
- **System logging**

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd piper-server-prototype-Ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/printer-management
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/profile` | Get user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change password | Private |
| POST | `/logout` | Logout user | Private |
| POST | `/refresh` | Refresh token | Private |

### User Management Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users (paginated) | Admin |
| GET | `/stats` | Get user statistics | Admin |
| GET | `/role/:role` | Get users by role | Admin/Manager |
| GET | `/:id` | Get user by ID | Admin/Manager |
| POST | `/` | Create new user | Admin |
| PUT | `/:id` | Update user | Admin |
| DELETE | `/:id` | Delete user | Admin |
| PUT | `/:id/reset-password` | Reset user password | Admin |
| PUT | `/bulk-update-roles` | Bulk update user roles | Admin |

### Printer Routes (`/api/print`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/upload` | Upload file for printing | Authenticated |
| GET | `/jobs` | Get print jobs | Authenticated |
| POST | `/jobs` | Create print job | Authenticated |

## Default Users

After running `npm run setup-db`, the following default users are created:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@example.com | admin123 | Full system access |
| Clerk | clerk@example.com | clerk123 | Job management, print submission |
| Manager | manager@example.com | manager123 | Analytics, reports, agent management |
| Technician | technician@example.com | technician123 | Printer maintenance, log viewing |

## User Roles & Permissions

### Admin
- Manage users (create, update, delete)
- View analytics and reports
- Manage system settings
- View all jobs and logs
- Full access to all features

### Manager
- View analytics and reports
- Manage agents
- View all jobs
- View system logs
- Monitor system performance

### Clerk
- Manage print jobs
- Submit files for printing
- View agent status
- View own jobs
- Monitor job progress

### Technician
- Maintain printers
- View system logs
- Monitor agent status
- Perform maintenance tasks

### Customer
- Submit print jobs
- View own jobs
- Track job status

## Authentication Flow

1. **Registration/Login**: User provides email and password
2. **Token Generation**: Server generates JWT token with user info
3. **Token Storage**: Client stores token (localStorage/sessionStorage)
4. **Request Authorization**: Client sends token in Authorization header
5. **Token Verification**: Server verifies token and extracts user info
6. **Permission Check**: Server checks user permissions for requested action

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers
- **Input Validation**: Request validation with express-validator
- **Rate Limiting**: Built-in Express rate limiting
- **SQL Injection Protection**: Mongoose ODM protection

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors (if any)
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run setup-db` - Initialize database with default users

### Project Structure

```
src/
├── controllers/          # Route controllers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── printer.controller.ts
├── models/              # Database models
│   ├── user.model.ts
│   └── printer.model.ts
├── routes/              # API routes
│   ├── auth.route.ts
│   ├── user.route.ts
│   └── printer.route.ts
├── middleware/          # Custom middleware
│   └── validation.ts
├── db/                  # Database connection
│   └── connection.ts
└── app.ts              # Main application file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.