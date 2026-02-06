<div align="center">

<img src="./Frontend/public/uce-logo.png" alt="UCE Logo" width="140" />

# 🗺️ UCE Interactive 3D Campus Map

**Immersive Visualization Platform & Academic Management System**

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%7C%20R3F-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%7C%20Nginx-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-documentation">API</a>
</p>

<p align="center">
  <strong>
    <a href="./README.es.md">🇪🇸 Leer en Español</a>
  </strong>
</p>

</div>

---

## 📖 About The Project

**UCE Interactive 3D Campus Map** is an advanced technological solution designed for **Universidad Central del Ecuador (UCE)**. It modernizes the university navigation experience by combining an interactive 3D environment with a robust event and facility management system.

The platform enables students and visitors to virtually explore the campus while administrators manage institutional information through a secure control panel with real-time analytics.

### 🎯 Project Goals

- **Enhance Campus Navigation**: Provide an intuitive, immersive way to explore university facilities
- **Centralize Event Management**: Unified platform for academic event scheduling and discovery
- **Real-time Analytics**: Track visitor engagement and popular locations
- **Accessibility**: Mobile-responsive design for on-the-go access
- **Scalability**: Microservices architecture ready for future expansion

> **Status:** 🚀 Production Ready | **Version:** 2.0.0 | **Last Updated:** February 2026

---

## ✨ Features

### 🌍 Interactive 3D Exploration

<details>
<summary><b>Dual Navigation Modes</b></summary>

- **Satellite View**: Bird's-eye perspective with orbital controls (zoom, rotate, pan)
- **First-Person Mode (FPS)**: Ground-level exploration with WASD controls
  - Variable speed (Shift to sprint, Ctrl to crouch)
  - Smooth camera transitions
  - Collision detection
  - Interactive crosshair and control hints

</details>

<details>
<summary><b>Smart Building Detection</b></summary>

- **Proximity-Based Interaction**: Automatic information display when approaching buildings
  - **25m range**: Building info card appears
  - **18m range**: Events modal opens (for active events)
  - **12m range**: Visit automatically registered
- **Edge-Based Distance Calculation**: Accounts for building size, not just center point
- **Intelligent Switching**: Seamlessly transitions between nearby buildings

</details>

<details>
<summary><b>Real-Time Building Information</b></summary>

- **Dynamic Status Indicators**: Open/Closed status based on current time
- **Schedule Display**: Operating hours with visual indicators
- **Category Tags**: Faculty, Library, Administrative, etc.
- **Event Notifications**: Pop-ups for ongoing events
- **Image Galleries**: Building photos and descriptions

</details>

### 🎓 Student Features

<details>
<summary><b>Personalized Experience</b></summary>

- **Faculty Pin**: Your assigned faculty highlighted with custom marker
- **Welcome Animation**: Automatic fly-to animation on first login
- **My Agenda**: Personal event calendar with subscription management
- **Event Discovery**: Browse all campus events by location
- **Smart Search**: Instant search for buildings, faculties, and services

</details>

<details>
<summary><b>Event Management</b></summary>

- **Event Subscriptions**: Save events to personal calendar
- **Email Notifications**: Automatic reminders for subscribed events
- **Filtering Options**: By date, location, category
- **Event Details**: Time, location, description, organizer info
- **Real-Time Updates**: WebSocket-powered live event changes

</details>

### 👨‍💼 Administrator Dashboard

<details>
<summary><b>Analytics & Insights</b></summary>

- **Visit Tracking**: Real-time visitor statistics per building
- **Event Metrics**: Attendance tracking and engagement analysis
- **Interactive Charts**: 
  - Visit distribution by faculty
  - Event timeline visualization
  - Peak hours analysis
  - User engagement trends
- **Export Capabilities**: Download reports in CSV/PDF format

</details>

<details>
<summary><b>Content Management</b></summary>

- **Event CRUD**: Create, edit, delete academic events
  - Rich text editor for descriptions
  - Image upload support
  - Recurring event scheduling
  - Email notification triggers
- **Location Management**: Update building information
  - Operating hours configuration
  - Category assignment
  - 3D model mapping
  - Image gallery management
- **User Management**: Role-based access control (Admin, Student, Guest)

</details>

### 🔐 Security & Authentication

<details>
<summary><b>Multi-Factor Authentication</b></summary>

- **Hybrid Login System**:
  - Google OAuth 2.0 integration
  - Institutional credentials (email/password)
  - JWT-based session management
- **Email Verification**: Secure account activation
- **Password Recovery**: Token-based reset flow
- **Role-Based Access**: Granular permission system

</details>

### 🌐 Real-Time Features

<details>
<summary><b>WebSocket Integration</b></summary>

- **Live Event Updates**: Instant notifications for new/modified events
- **Analytics Streaming**: Real-time dashboard updates
- **Concurrent User Support**: Socket.io-powered connections
- **Automatic Reconnection**: Resilient connection handling

</details>

### 🎨 UI/UX Excellence

<details>
<summary><b>Design System</b></summary>

- **Dark/Light Theme**: Automatic theme switching with smooth transitions
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Accessibility**: WCAG 2.1 compliant
- **Animations**: GSAP-powered smooth transitions
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages

</details>

---

## 🖼️ Screenshots

> **Note**: Screenshots can be hosted on Backblaze B2 for optimal performance

| Satellite View | FPS Mode |
|:---:|:---:|
| ![Satellite View](https://via.placeholder.com/600x400/1e3a8a/ffffff?text=Satellite+View) | ![FPS Mode](https://via.placeholder.com/600x400/059669/ffffff?text=FPS+Mode) |
| **Building Info Card** | **Events Modal** |
| ![Building Info](https://via.placeholder.com/600x400/7c3aed/ffffff?text=Building+Info) | ![Events](https://via.placeholder.com/600x400/dc2626/ffffff?text=Events+Modal) |
| **Admin Dashboard** | **Analytics** |
| ![Dashboard](https://via.placeholder.com/600x400/D9232D/ffffff?text=Admin+Dashboard) | ![Analytics](https://via.placeholder.com/600x400/ea580c/ffffff?text=Analytics) |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose | Version |
|:---|:---|:---:|
| **React** | UI Framework | 18.3.1 |
| **Vite** | Build Tool & Dev Server | 6.0.5 |
| **Three.js** | 3D Graphics Engine | 0.171.0 |
| **React Three Fiber** | React Renderer for Three.js | 8.18.3 |
| **React Three Drei** | Three.js Helpers | 9.119.1 |
| **TailwindCSS** | Utility-First CSS | 3.4.17 |
| **Zustand** | State Management | 5.0.2 |
| **React Router** | Client-Side Routing | 7.1.1 |
| **Axios** | HTTP Client | 1.7.9 |
| **Socket.io Client** | WebSocket Client | 4.8.1 |
| **GSAP** | Animation Library | 3.12.5 |
| **Recharts** | Data Visualization | 2.15.0 |
| **Lucide React** | Icon Library | 0.468.0 |

### Backend

| Technology | Purpose | Version |
|:---|:---|:---:|
| **Node.js** | Runtime Environment | 22.x |
| **Express** | Web Framework | 4.21.2 |
| **PostgreSQL** | Relational Database | 15 |
| **Redis** | Caching Layer | Alpine |
| **Passport.js** | Authentication | 0.7.0 |
| **JWT** | Token Management | 9.0.2 |
| **Bcrypt** | Password Hashing | 5.1.1 |
| **Nodemailer** | Email Service | 6.9.16 |
| **Socket.io** | WebSocket Server | 4.8.1 |
| **Multer** | File Upload | 1.4.5-lts.1 |

### DevOps & Infrastructure

| Technology | Purpose |
|:---|:---|
| **Docker** | Containerization |
| **Docker Compose** | Multi-Container Orchestration |
| **Nginx** | Reverse Proxy & Static Serving |
| **PgAdmin** | PostgreSQL Management UI |
| **Redis Commander** | Redis Management UI |

---

## 🚀 Installation

### Prerequisites

- **Docker Desktop** (v20.10+) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/downloads)
- **Node.js** (v22+) - Optional, for local development

### Quick Start (Docker - Recommended)

1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/uce-interactive-map.git
cd uce-interactive-map
```

2. **Configure Environment Variables**

Create `.env` file in `Backend/` directory:

```env
# Database Configuration
DB_HOST=postgres_db
DB_USER=admin_sql
DB_PASSWORD=your_secure_password
DB_NAME=uce_main_db
DB_PORT=5432

# Redis Configuration
REDIS_HOST=redis_cache
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=your_jwt_secret_key_change_in_production

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Upload Path
UPLOAD_PATH=/app/public/uploads
```

3. **Start All Services**

```bash
docker-compose up -d --build
```

This command will:
- Build the frontend (production build with Vite)
- Start the backend API server
- Initialize PostgreSQL database
- Start Redis cache
- Launch PgAdmin and Redis Commander

4. **Access the Application**

| Service | URL | Credentials |
|:---|:---|:---|
| **🌐 Web Application** | http://localhost | - |
| **🔌 API Server** | http://localhost:5000 | - |
| **🐘 PgAdmin** | http://localhost:5050 | admin-mapa@uce.edu.ec / admin |
| **📊 Redis Commander** | http://localhost:8082 | - |

5. **Initialize Database**

The database schema will be automatically created on first run. To seed initial data:

```bash
docker exec -it uce_backend npm run seed
```

### Local Development (Without Docker)

<details>
<summary><b>Click to expand local setup instructions</b></summary>

**Frontend Setup**

```bash
cd Frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

**Backend Setup**

```bash
cd Backend
npm install

# Create .env file with local database credentials
# DB_HOST=localhost
# DB_PORT=5432
# etc.

npm run dev
```

Backend will run on `http://localhost:5000`

**Database Setup**

Install PostgreSQL and Redis locally, then run migrations:

```bash
cd Backend
npm run migrate
npm run seed
```

</details>

---

## 🏗️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
    end
    
    subgraph "Frontend - React SPA"
        B[React Router]
        C[Three.js 3D Engine]
        D[Zustand State]
        E[Socket.io Client]
    end
    
    subgraph "Backend - Node.js API"
        F[Express Server]
        G[Passport Auth]
        H[Socket.io Server]
        I[Email Service]
    end
    
    subgraph "Data Layer"
        J[(PostgreSQL)]
        K[(Redis Cache)]
    end
    
    A --> B
    B --> C
    B --> D
    D --> E
    E --> H
    B --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K
```

### Database Schema

**PostgreSQL Tables:**

- `users` - User accounts and authentication
- `locations` - Building/facility information
- `events` - Academic events and activities
- `visits` - Visit tracking analytics
- `event_subscriptions` - User event subscriptions

**Redis Keys:**

- `locations:all` - Cached location list
- `events:upcoming` - Cached upcoming events
- `session:{userId}` - User session data

### API Architecture

RESTful API with the following endpoints:

<details>
<summary><b>Authentication Endpoints</b></summary>

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile
- `POST /api/verify-email` - Email verification
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset

</details>

<details>
<summary><b>Location Endpoints</b></summary>

- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get location by ID
- `POST /api/locations` - Create location (Admin)
- `PUT /api/locations/:id` - Update location (Admin)
- `DELETE /api/locations/:id` - Delete location (Admin)
- `POST /api/locations/:id/visit` - Register visit

</details>

<details>
<summary><b>Event Endpoints</b></summary>

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/location/:id` - Get events by location
- `POST /api/events` - Create event (Admin)
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)

</details>

<details>
<summary><b>Calendar Endpoints</b></summary>

- `GET /api/calendar/my-subscriptions` - Get user subscriptions
- `POST /api/calendar/subscribe/:eventId` - Subscribe to event
- `DELETE /api/calendar/unsubscribe/:eventId` - Unsubscribe from event

</details>

<details>
<summary><b>Analytics Endpoints</b></summary>

- `GET /api/analytics/visits` - Get visit statistics
- `GET /api/analytics/events` - Get event statistics
- `GET /api/reports/visits` - Export visit report
- `GET /api/reports/events` - Export event report

</details>

---

## 📡 WebSocket Events

Real-time communication via Socket.io:

| Event | Direction | Description |
|:---|:---:|:---|
| `eventCreated` | Server → Client | New event created |
| `eventUpdated` | Server → Client | Event modified |
| `eventDeleted` | Server → Client | Event removed |
| `analyticsUpdate` | Server → Client | Analytics data changed |

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API request throttling
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data protection

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## 📦 Deployment

### Production Build

```bash
# Build frontend for production
cd Frontend
npm run build

# Build backend Docker image
cd Backend
docker build -t uce-backend:latest .
```

### Environment Configuration

Update environment variables for production:

```env
NODE_ENV=production
DB_HOST=your-production-db-host
REDIS_HOST=your-production-redis-host
JWT_SECRET=strong-production-secret
```

### Nginx Configuration

The frontend is served via Nginx with:
- Gzip compression
- Static asset caching
- SPA routing support
- API proxy configuration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Frontend**: ESLint + Prettier
- **Backend**: ESLint + Airbnb Style Guide
- **Commits**: Conventional Commits
- **Language**: 
  - **Code/Comments/Logs**: English
  - **UI/UX**: Spanish

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Developed with ❤️ for **Universidad Central del Ecuador**

- **Project Lead**: [Your Name]
- **Backend Developer**: [Name]
- **Frontend Developer**: [Name]
- **3D Artist**: [Name]
- **UI/UX Designer**: [Name]

---

## 📞 Support

For support, email support@uce.edu.ec or open an issue in this repository.

---

## 🙏 Acknowledgments

- Universidad Central del Ecuador for project sponsorship
- Three.js community for 3D rendering support
- React Three Fiber team for excellent documentation
- All contributors and testers

---

<div align="center">

### 🌟 Star this repository if you find it helpful!

**2025 - 2026 © Universidad Central del Ecuador - All Rights Reserved**

</div>

---
---

<div align="center" id="español-">

<img src="./Frontend/public/uce-logo.png" alt="Logo UCE" width="140" />

# 🗺️ Mapa Interactivo 3D del Campus UCE

**Plataforma de Visualización Inmersiva y Sistema de Gestión Académica**

<p align="center">
  <a href="#-características">Características</a> •
  <a href="#-demostración">Demo</a> •
  <a href="#-tecnologías">Tecnologías</a> •
  <a href="#-instalación-1">Instalación</a> •
  <a href="#-arquitectura-1">Arquitectura</a> •
  <a href="#-documentación-api">API</a>
</p>

<p align="center">
  <strong>
    <a href="#-about-the-project">🇺🇸 Read in English</a>
  </strong>
</p>

</div>

---

## 📖 Sobre el Proyecto

El **Mapa Interactivo 3D del Campus UCE** es una solución tecnológica avanzada diseñada para la **Universidad Central del Ecuador (UCE)**. Moderniza la experiencia de navegación universitaria combinando un entorno 3D interactivo con un sistema robusto de gestión de eventos e instalaciones.

La plataforma permite a estudiantes y visitantes explorar virtualmente el campus mientras los administradores gestionan la información institucional a través de un panel de control seguro con analíticas en tiempo real.

### 🎯 Objetivos del Proyecto

- **Mejorar la Navegación del Campus**: Proporcionar una forma intuitiva e inmersiva de explorar las instalaciones universitarias
- **Centralizar la Gestión de Eventos**: Plataforma unificada para programación y descubrimiento de eventos académicos
- **Analíticas en Tiempo Real**: Rastrear el compromiso de visitantes y ubicaciones populares
- **Accesibilidad**: Diseño responsivo para acceso móvil
- **Escalabilidad**: Arquitectura de microservicios lista para expansión futura

> **Estado:** 🚀 Listo para Producción | **Versión:** 2.0.0 | **Última Actualización:** Febrero 2026

---

## ✨ Características

### 🌍 Exploración 3D Interactiva

<details>
<summary><b>Modos de Navegación Duales</b></summary>

- **Vista Satélite**: Perspectiva aérea con controles orbitales (zoom, rotación, paneo)
- **Modo Primera Persona (FPS)**: Exploración a nivel del suelo con controles WASD
  - Velocidad variable (Shift para correr, Ctrl para agacharse)
  - Transiciones suaves de cámara
  - Detección de colisiones
  - Mira interactiva y pistas de control

</details>

<details>
<summary><b>Detección Inteligente de Edificios</b></summary>

- **Interacción Basada en Proximidad**: Visualización automática de información al acercarse a edificios
  - **Rango 25m**: Aparece tarjeta de información del edificio
  - **Rango 18m**: Se abre modal de eventos (para eventos activos)
  - **Rango 12m**: Visita registrada automáticamente
- **Cálculo de Distancia al Borde**: Considera el tamaño del edificio, no solo el punto central
- **Cambio Inteligente**: Transiciones fluidas entre edificios cercanos

</details>

<details>
<summary><b>Información de Edificios en Tiempo Real</b></summary>

- **Indicadores de Estado Dinámicos**: Estado Abierto/Cerrado basado en la hora actual
- **Visualización de Horarios**: Horarios de operación con indicadores visuales
- **Etiquetas de Categoría**: Facultad, Biblioteca, Administrativo, etc.
- **Notificaciones de Eventos**: Pop-ups para eventos en curso
- **Galerías de Imágenes**: Fotos y descripciones de edificios

</details>

### 🎓 Funciones para Estudiantes

<details>
<summary><b>Experiencia Personalizada</b></summary>

- **Pin de Facultad**: Tu facultad asignada resaltada con marcador personalizado
- **Animación de Bienvenida**: Animación automática de vuelo al primer inicio de sesión
- **Mi Agenda**: Calendario personal de eventos con gestión de suscripciones
- **Descubrimiento de Eventos**: Explorar todos los eventos del campus por ubicación
- **Búsqueda Inteligente**: Búsqueda instantánea de edificios, facultades y servicios

</details>

<details>
<summary><b>Gestión de Eventos</b></summary>

- **Suscripciones a Eventos**: Guardar eventos en calendario personal
- **Notificaciones por Email**: Recordatorios automáticos para eventos suscritos
- **Opciones de Filtrado**: Por fecha, ubicación, categoría
- **Detalles de Eventos**: Hora, ubicación, descripción, información del organizador
- **Actualizaciones en Tiempo Real**: Cambios de eventos en vivo mediante WebSocket

</details>

### 👨‍💼 Panel de Administración

<details>
<summary><b>Analíticas e Insights</b></summary>

- **Seguimiento de Visitas**: Estadísticas de visitantes en tiempo real por edificio
- **Métricas de Eventos**: Seguimiento de asistencia y análisis de compromiso
- **Gráficos Interactivos**:
  - Distribución de visitas por facultad
  - Visualización de línea de tiempo de eventos
  - Análisis de horas pico
  - Tendencias de compromiso de usuarios
- **Capacidades de Exportación**: Descargar informes en formato CSV/PDF

</details>

<details>
<summary><b>Gestión de Contenido</b></summary>

- **CRUD de Eventos**: Crear, editar, eliminar eventos académicos
  - Editor de texto enriquecido para descripciones
  - Soporte de carga de imágenes
  - Programación de eventos recurrentes
  - Activadores de notificación por email
- **Gestión de Ubicaciones**: Actualizar información de edificios
  - Configuración de horarios de operación
  - Asignación de categorías
  - Mapeo de modelos 3D
  - Gestión de galería de imágenes
- **Gestión de Usuarios**: Control de acceso basado en roles (Admin, Estudiante, Invitado)

</details>

### 🔐 Seguridad y Autenticación

<details>
<summary><b>Autenticación Multi-Factor</b></summary>

- **Sistema de Login Híbrido**:
  - Integración con Google OAuth 2.0
  - Credenciales institucionales (email/contraseña)
  - Gestión de sesiones basada en JWT
- **Verificación de Email**: Activación segura de cuenta
- **Recuperación de Contraseña**: Flujo de restablecimiento basado en tokens
- **Acceso Basado en Roles**: Sistema de permisos granular

</details>

### 🌐 Funciones en Tiempo Real

<details>
<summary><b>Integración WebSocket</b></summary>

- **Actualizaciones de Eventos en Vivo**: Notificaciones instantáneas para eventos nuevos/modificados
- **Streaming de Analíticas**: Actualizaciones de dashboard en tiempo real
- **Soporte de Usuarios Concurrentes**: Conexiones mediante Socket.io
- **Reconexión Automática**: Manejo resiliente de conexiones

</details>

### 🎨 Excelencia UI/UX

<details>
<summary><b>Sistema de Diseño</b></summary>

- **Tema Oscuro/Claro**: Cambio automático de tema con transiciones suaves
- **Diseño Responsivo**: Optimizado para móvil, tablet y escritorio
- **Accesibilidad**: Cumple con WCAG 2.1
- **Animaciones**: Transiciones suaves mediante GSAP
- **Estados de Carga**: Pantallas skeleton e indicadores de progreso
- **Manejo de Errores**: Mensajes de error amigables para el usuario

</details>

---

## 🛠️ Tecnologías

### Frontend

| Tecnología | Propósito | Versión |
|:---|:---|:---:|
| **React** | Framework UI | 18.3.1 |
| **Vite** | Herramienta de Build | 6.0.5 |
| **Three.js** | Motor Gráfico 3D | 0.171.0 |
| **React Three Fiber** | Renderizador React para Three.js | 8.18.3 |
| **TailwindCSS** | CSS Utility-First | 3.4.17 |
| **Zustand** | Gestión de Estado | 5.0.2 |
| **React Router** | Enrutamiento | 7.1.1 |
| **Socket.io Client** | Cliente WebSocket | 4.8.1 |
| **GSAP** | Biblioteca de Animación | 3.12.5 |
| **Recharts** | Visualización de Datos | 2.15.0 |

### Backend

| Tecnología | Propósito | Versión |
|:---|:---|:---:|
| **Node.js** | Entorno de Ejecución | 22.x |
| **Express** | Framework Web | 4.21.2 |
| **PostgreSQL** | Base de Datos Relacional | 15 |
| **Redis** | Capa de Caché | Alpine |
| **Passport.js** | Autenticación | 0.7.0 |
| **JWT** | Gestión de Tokens | 9.0.2 |
| **Nodemailer** | Servicio de Email | 6.9.16 |
| **Socket.io** | Servidor WebSocket | 4.8.1 |

---

## 🚀 Instalación

### Requisitos Previos

- **Docker Desktop** (v20.10+)
- **Git**
- **Node.js** (v22+) - Opcional, para desarrollo local

### Inicio Rápido (Docker - Recomendado)

1. **Clonar el Repositorio**

```bash
git clone https://github.com/tuusuario/uce-mapa-interactivo.git
cd uce-mapa-interactivo
```

2. **Configurar Variables de Entorno**

Crear archivo `.env` en directorio `Backend/`:

```env
DB_HOST=postgres_db
DB_USER=admin_sql
DB_PASSWORD=tu_contraseña_segura
DB_NAME=uce_main_db
REDIS_HOST=redis_cache
JWT_SECRET=tu_clave_secreta_jwt
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-app
```

3. **Iniciar Todos los Servicios**

```bash
docker-compose up -d --build
```

4. **Acceder a la Aplicación**

| Servicio | URL | Credenciales |
|:---|:---|:---|
| **🌐 Aplicación Web** | http://localhost | - |
| **🔌 Servidor API** | http://localhost:5000 | - |
| **🐘 PgAdmin** | http://localhost:5050 | admin-mapa@uce.edu.ec / admin |

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz Fork del repositorio
2. Crea tu rama de funcionalidad (`git checkout -b feature/CaracteristicaIncreible`)
3. Commit tus cambios (`git commit -m 'Agregar CaracteristicaIncreible'`)
4. Push a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abre un Pull Request

### Guía de Estilo

- **Frontend**: ESLint + Prettier
- **Backend**: ESLint + Airbnb Style Guide
- **Commits**: Conventional Commits
- **Idioma**:
  - **Código/Comentarios/Logs**: Inglés
  - **Interfaz de Usuario (UI)**: Español

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

<div align="center">

**Desarrollado con ❤️ para la Universidad Central del Ecuador**

**2025 - 2026 © Universidad Central del Ecuador - Todos los Derechos Reservados**

</div>
