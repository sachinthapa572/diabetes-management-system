# Diabetes Management System - Backend API

A comprehensive, HIPAA-compliant backend API for managing diabetes patient data, glucose readings, alerts, and healthcare provider relationships. Built with Node.js, TypeScript, Express, and PostgreSQL.

## 🚀 Features

### For Patients

- **Glucose Tracking**: Record glucose readings with context (fasting, pre/post-meal, bedtime)
- **Comprehensive Logging**: Track medications, carbs, exercise, and stress levels
- **Real-time Analytics**: Interactive charts and trends analysis
- **Smart Alerts**: Configurable notifications for high/low glucose levels

### For Healthcare Providers

- **Patient Dashboard**: Monitor multiple patients from a single interface
- **Real-time Monitoring**: View patient glucose trends and recent readings
- **Alert Management**: Receive notifications for critical patient events
- **Detailed Reports**: Access comprehensive patient analytics and history

## 🛠 Technology Stack

### Backend

- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Winston** for logging
- **Helmet** for security headers
- **Bun** runtime for performance

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.2.17 or higher
- PostgreSQL database
- Node.js 18+ (for compatibility)

## 🚀 Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/sachinthapa572/diabetes-management-system.git
   cd diabetes-management-system
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration (see .env.sample)

4. **Set up the database:**

   ```bash
   # Generate Prisma client
   bunx prisma generate

   # Run database migrations
   bunx prisma migrate deploy

   # Optional: Seed the database
   bunx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:8080` with health check at `/api/v1/health`.

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities:

- **Users** - Patients, providers, and admins
- **Readings** - Glucose level measurements with context
- **AlertConfig** - User-specific alert thresholds
- **AlertHistory** - Generated alerts and notifications
- **PatientProvider** - Healthcare provider relationships
- **Medications** - Patient medication tracking
- **AuditLog** - HIPAA-compliant activity logging

## 🔐 Security Features

### Authentication

- Secure password requirements (8+ chars, mixed case, numbers, symbols)
- JWT tokens with 24-hour expiration
- Automatic token refresh
- Session management

### Data Protection

- All sensitive data encrypted at rest
- HTTPS enforcement in production
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### HIPAA Compliance

- Comprehensive audit logging
- Role-based access controls
- Secure data transmission
- Patient consent management
- Data retention policies

## 🔄 Background Services

The server includes automated background services:

- **Weekly Reports**: Automated patient glucose summaries
- **Alert Monitoring**: Real-time glucose threshold monitoring
- **Data Cleanup**: Automated log rotation and cleanup

## 🏥 HIPAA Compliance

This application implements HIPAA-compliant features:

- Comprehensive audit logging
- Secure data transmission (HTTPS)
- Access controls and authentication
- Data encryption at rest and in transit
- Automatic session management

## 🚨 Error Handling

- Centralized error handling middleware
- Structured error responses
- Request logging with Winston
- Health monitoring endpoints

## 📝 Development Notes

- Built with **Bun** runtime for performance
- **TypeScript** for type safety
- **Prisma** for database operations
- **Express.js** for HTTP server
- **Express validator** for input validation
- **Winston** for logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:

- Issues: [GitHub Issues](https://github.com/sachinthapa572/diabetes-management-system/issues)

---

**Note**: This is a healthcare application handling sensitive patient data. Ensure all deployments meet HIPAA compliance requirements.
