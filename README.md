# Medical API

A comprehensive RESTful API for managing medical appointments, patient records, doctors, and healthcare services. Built with Node.js, Express, TypeScript, and SQLite.

## 📋 Features

- **Patient Management**: Register and manage patient information including personal details and medical history
- **Doctor Management**: Handle doctor profiles with specialties, departments, and availability slots
- **Appointment System**: Schedule, update, and cancel medical appointments
- **Medical Records**: Store and retrieve patient diagnoses, prescriptions, treatments, and test results
- **Department & Specialty Management**: Organize healthcare services by departments and medical specialties
- **Authentication & Authorization**: Secure login system with JWT tokens for patients, doctors, and admins
- **Notifications**: Send and manage notifications for appointments and updates
- **Audit Logging**: Track system actions and changes for accountability
- **Admin Panel**: Administrative interface for system management

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.0
- **Language**: TypeScript
- **Database**: SQLite3
- **Dependency Injection**: TypeDI
- **Authentication**: JSON Web Tokens (JWT)
- **Testing**: Jest with Supertest
- **Development Tools**: 
  - Nodemon (auto-restart)
  - ts-node (TypeScript execution)
  - Morgan (HTTP logging)
  - CORS (Cross-Origin Resource Sharing)

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/LilSamu/MedicalApi.git
cd MedicalApi
```

2. Install dependencies:
```bash
npm install
```

3. The database will be automatically initialized when you first run the application.

## 🚀 Running the Application

### Development Mode
Start the server with auto-reload on file changes:
```bash
npm run dev
```

### Production Mode
Build and run the production version:
```bash
npm run build
npm start
```

The server will start on the configured port (default: check `src/config/environment/development.ts`).

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📁 Project Structure

```
MedicalApi/
├── src/
│   ├── app/                      # Application modules
│   │   ├── admin/                # Admin management
│   │   ├── appointments/         # Appointment scheduling
│   │   ├── audit-logs/           # Audit logging
│   │   ├── auth/                 # Authentication
│   │   ├── departments/          # Department management
│   │   ├── doctors/              # Doctor management
│   │   ├── medical-records/      # Medical records
│   │   ├── notifications/        # Notifications
│   │   ├── patients/             # Patient management
│   │   └── specialties/          # Medical specialties
│   ├── config/                   # Configuration files
│   │   └── environment/          # Environment-specific configs
│   ├── database/                 # Database service and models
│   ├── server/                   # Express server setup
│   │   ├── api/                  # API router
│   │   └── middlewares/          # Auth middleware
│   └── index.ts                  # Application entry point
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 🔌 API Endpoints

The API is accessible at `/api` base path.

### Authentication
- `POST /api/auth/login` - Login for patients, doctors, or admins

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete/cancel appointment

### Medical Records
- `GET /api/records` - Get all medical records
- `GET /api/records/:id` - Get medical record by ID
- `POST /api/records` - Create new medical record
- `PUT /api/records/:id` - Update medical record

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Specialties
- `GET /api/specialties` - Get all specialties
- `GET /api/specialties/:id` - Get specialty by ID
- `POST /api/specialties` - Create new specialty
- `PUT /api/specialties/:id` - Update specialty
- `DELETE /api/specialties/:id` - Delete specialty

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create new notification

### Admin
- `GET /api/admin` - Admin endpoints
- Admin authentication and management

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- **patients**: Patient personal information and credentials
- **doctors**: Doctor profiles, credentials, and department associations
- **departments**: Healthcare departments (e.g., Cardiology, General Medicine)
- **specialties**: Medical specialties (e.g., General Practice, Cardiology)
- **doctor_specialties**: Many-to-many relationship between doctors and specialties
- **availability_slots**: Doctor availability for appointments
- **appointments**: Scheduled patient appointments with doctors
- **medical_records**: Patient medical history, diagnoses, and prescriptions
- **test_results**: Medical test results linked to records
- **treatments**: Treatment plans linked to medical records
- **notifications**: System notifications for users
- **audit_logs**: Audit trail for system actions
- **admins**: Administrative users

## 🔐 Default Credentials

The system comes with default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials in production!

## 🔧 Configuration

Configuration files are located in `src/config/environment/`:
- `development.ts` - Development environment settings
- `test.ts` - Test environment settings

Key configurations:
- Server port
- Database connection
- JWT settings
- CORS settings

## 📝 License

ISC

## 👥 Author

Developed as part of a final practice project.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions or issues, please open an issue in the GitHub repository.
