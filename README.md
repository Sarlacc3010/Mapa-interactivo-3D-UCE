# 🎓 Campus Virtual 3D - Universidad Central del Ecuador (UCE)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/estado-En_Desarrollo-yellow)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_Three_Fiber-61DAFB?logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

> Una plataforma interactiva inmersiva que permite a estudiantes y visitantes explorar la **Universidad Central del Ecuador** en un entorno **3D**.  
> El sistema integra **Geofencing** para registrar visitas automáticas y notificar eventos académicos basándose en la proximidad del usuario dentro del mundo virtual.

---

## 📸 Demo y Capturas

![Vista del Campus 3D](./screenshots/demo_mapa.png)  
*(Reemplaza esta ruta con una captura real de tu proyecto)*

---

## ✨ Características Principales

### 🗺️ Experiencia 3D Inmersiva
- Navegación fluida por el campus utilizando modelos **GLB** optimizados.
- Renderizado de alto rendimiento con **React Three Fiber**.
- Interacción directa con edificios (clic para ver información, historia y eventos).

### 📍 Sistema de Geofencing (Proximidad)
El sistema calcula la distancia en tiempo real entre el avatar del usuario y los edificios del campus:

- **🔔 Alertas de Eventos (< 15 metros)**  
  Si existe un evento académico activo en una facultad cercana, se muestra una notificación emergente automática.

- **📝 Registro de Visitas (< 8 metros)**  
  Se registra automáticamente la visita del usuario en la base de datos para análisis de tráfico estudiantil.

### 🔐 Seguridad y Gestión
- **Autenticación JWT** para login y registro seguro.
- **Roles de Usuario**: Estudiantes y Administradores.
- **Dashboard Administrativo** *(En desarrollo)* para gestión de eventos y estadísticas.

---

## 🛠️ Stack Tecnológico

Arquitectura basada en microservicios contenerizados:

| Área | Tecnología | Descripción |
|-----|-----------|-------------|
| **Frontend** | React + Vite | SPA rápida y moderna |
| **Motor 3D** | React Three Fiber / Drei | Abstracción de Three.js |
| **Estilos** | Tailwind CSS | Diseño moderno y responsivo |
| **Backend** | Node.js + Express | API RESTful |
| **Base de Datos SQL** | PostgreSQL | Usuarios, eventos y visitas |
| **Base de Datos NoSQL** | MongoDB | Información detallada de facultades |
| **DevOps** | Docker & Docker Compose | Orquestación de contenedores |
| **Herramientas** | PgAdmin 4, Mongo Express | Gestión visual de BD |

---

## 🚀 Instalación y Despliegue

### 📌 Prerrequisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/Mapa-interactivo-3D-UCE.git
cd Mapa-interactivo-3D-UCE
```

---

### 2️⃣ Configurar Variables de Entorno (Backend)

Crear un archivo `.env` dentro de la carpeta `Backend/`:

```env
DB_USER=admin_sql
DB_PASSWORD=password_sql
DB_NAME=uce_main_db
DB_HOST=postgres_db
DB_PORT=5432
JWT_SECRET=uce_secreto_super_seguro
```

---

### 3️⃣ Ejecutar con Docker
Levanta todo el ecosistema con un solo comando:

```bash
docker-compose up --build
```

⏳ *Espera unos minutos mientras se descargan las imágenes y se instalan las dependencias.*

---

### 4️⃣ Inicializar la Base de Datos
Una vez que los contenedores estén corriendo:

```bash
docker exec -it uce_backend node init_db.js
```

✅ Mensaje esperado:
```
🚀 Base de datos inicializada correctamente.
```

---

## 🎮 Cómo Usar

### 🔑 Accesos
- **Frontend (Mapa 3D):** http://localhost:5173
- **Backend (API):** http://localhost:5000
- **PgAdmin (SQL):** http://localhost:5050  
  - Usuario: `admin@uce.edu.ec`  
  - Contraseña: `admin`
- **Mongo Express (NoSQL):** http://localhost:8081

---

### 🕹️ Controles 3D
- **Click izquierdo + arrastrar:** Rotar cámara
- **Click derecho + arrastrar:** Pan
- **Rueda del ratón:** Zoom
- **Click en edificio:** Ver información detallada

---

## 📂 Estructura del Proyecto

```text
Mapa-interactivo-3D-UCE/
├── Backend/                 # API REST Node.js
│   ├── index.js             # Punto de entrada del servidor
│   ├── init_db.js           # Inicialización SQL
│   ├── db_postgres.js       # Pool PostgreSQL
│   └── Dockerfile           # Imagen Docker Backend
├── Frontend/                # Aplicación React
│   ├── public/
│   │   └── mapa_uce.glb     # Modelo 3D del campus
│   ├── src/
│   │   ├── Campus3D.jsx     # Lógica 3D y Geofencing
│   │   ├── components/      # UI (Login, Popups, Paneles)
│   │   └── data/            # Datos estáticos
│   └── Dockerfile           # Imagen Docker Frontend
└── docker-compose.yml       # Orquestador de servicios
```

