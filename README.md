<div align="center">

  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Escudo_de_la_Universidad_Central_del_Ecuador.svg" alt="Logo UCE" width="120" />

  # 🗺️ UCE Campus 3D: Interactive Map
  
  **Plataforma de Visualización Inmersiva y Gestión Académica**
  
  ![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)
  ![Threejs](https://img.shields.io/badge/3D-Three.js%20%7C%20R3F-black?style=for-the-badge&logo=three.js)
  ![Node](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js)
  ![Docker](https://img.shields.io/badge/Infra-Docker%20%7C%20Nginx-2496ED?style=for-the-badge&logo=docker)
  
  <p align="center">
    <a href="#-demo">Ver Demo</a> •
    <a href="#-características">Características</a> •
    <a href="#-instalación">Instalación</a> •
    <a href="#-arquitectura">Arquitectura</a>
  </p>
</div>

---

## 📖 Descripción del Proyecto

**UCE Campus 3D** es una solución tecnológica avanzada diseñada para la **Universidad Central del Ecuador**. Moderniza la experiencia de navegación universitaria combinando un entorno tridimensional interactivo con un sistema robusto de gestión de eventos y facultades.

El sistema permite a estudiantes y visitantes recorrer el campus virtualmente, mientras que los administradores gestionan la información institucional mediante un panel de control seguro y métricas en tiempo real.

> **Estado:** 🚀 Listo para Producción (Transición a JAMstack)

---

## 📸 Galería Visual

| Vista Aérea del Campus | Panel Administrativo |
|:---:|:---:|
| <img src="https://via.placeholder.com/600x300/1e3a8a/ffffff?text=Vista+3D+del+Mapa" alt="Mapa 3D" width="100%"> | <img src="https://via.placeholder.com/600x300/D9232D/ffffff?text=Dashboard+Admin" alt="Dashboard" width="100%"> |
| **Exploración Inmersiva** | **Gestión y Métricas** |

---

## ⚡ Stack Tecnológico

El proyecto utiliza una arquitectura de microservicios contenerizada.

| Área | Tecnologías |
| :--- | :--- |
| **Frontend 3D** | ![React](https://img.shields.io/badge/-React-black?logo=react) ![Tailwind](https://img.shields.io/badge/-Tailwind-black?logo=tailwindcss) ![R3F](https://img.shields.io/badge/-React%20Three%20Fiber-black) ![Recharts](https://img.shields.io/badge/-Recharts-black) |
| **Backend API** | ![Node](https://img.shields.io/badge/-Node.js-black?logo=node.js) ![Express](https://img.shields.io/badge/-Express-black) ![Passport](https://img.shields.io/badge/-Passport.js-black) ![JWT](https://img.shields.io/badge/-JWT-black) |
| **Data Layer** | ![Postgres](https://img.shields.io/badge/-PostgreSQL-black?logo=postgresql) ![Redis](https://img.shields.io/badge/-Redis-black?logo=redis) |
| **DevOps** | ![Docker](https://img.shields.io/badge/-Docker-black?logo=docker) ![Nginx](https://img.shields.io/badge/-Nginx-black?logo=nginx) |

---

## 🚀 Características Clave

### 🔵 Experiencia de Usuario (Estudiantes)
* **Navegación 3D Fluida:** Zoom, rotación y paneo con controles orbitales optimizados.
* **Smart Search:** Buscador instantáneo de facultades, bibliotecas y servicios.
* **Eventos en Contexto:** Pop-ups informativos sobre actividades al hacer clic en edificios.
* **Diseño Responsivo:** Adaptado a móviles y escritorio.

### 🔴 Panel de Administración (Gestores)
* **Dashboard de Métricas:** Gráficos de visitas y distribución de eventos.
* **CRUD de Eventos:** Creación, edición y eliminación de agenda académica.
* **Gestión de Ubicaciones:** Actualización de información de edificios.
* **Seguridad:** Login híbrido (Google OAuth + Credenciales Institucionales).

---

## 🛠️ Instalación y Despliegue

Sigue estos pasos para levantar el entorno completo usando **Docker**.

### 1. Prerrequisitos
* Docker Desktop (Running)
* Git

### 2. Clonar y Configurar
```bash
git clone [https://github.com/tu-usuario/uce-mapa-3d.git](https://github.com/tu-usuario/uce-mapa-3d.git)
cd uce-mapa-3d

```

Crea un archivo `.env` en la carpeta `Backend/`:

```env
# Database Config
DB_HOST=postgres_db
DB_USER=admin_sql
DB_PASSWORD=password_sql
DB_NAME=uce_main_db

# NoSQL & Cache
MONGO_URI=mongodb://admin_mongo:password_mongo@mongo_db:27017/uce_nosql_db?authSource=admin
REDIS_HOST=redis_cache

# Auth keys
JWT_SECRET=secret_key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

```

### 3. Ejecutar Contenedores

Este comando construye el Frontend (JAMstack build), levanta el Backend y las Bases de Datos.

```bash
docker-compose up -d --build

```

### 4. Acceder a los Servicios

| Servicio | URL | Descripción |
| --- | --- | --- |
| ** 🌍 Web App** | `http://localhost:80` | Portal principal (Nginx) |
| ** 🔌 API Server** | `http://localhost:5000` | Endpoints REST |
| ** 🐘 PgAdmin** | `http://localhost:5050` | Admin SQL (`admin-mapa@uce.edu.ec` / `admin`) |
| ** 🍃 Mongo Express** | `http://localhost:8081` | Admin NoSQL |

---

## 🏛️ Arquitectura de Datos

El sistema utiliza una estrategia de persistencia híbrida para maximizar el rendimiento:

1. **PostgreSQL (Relacional):**
* Manejo de integridad crítica: `Usuarios`, `Roles`, `Eventos`, `Relación Edificio-Evento`.


2. **MongoDB (Documental):**
* Información flexible de edificios: `Coordenadas 3D`, `Metadatos`, `Historial de cambios`.


3. **Redis (Key-Value):**
* Caché de consultas frecuentes (Lista de Facultades) para reducir latencia.



---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un Fork del proyecto.
2. Crea tu rama de funcionalidad (`git checkout -b feature/AmazingFeature`).
3. Commit a tus cambios (`git commit -m 'Add some AmazingFeature'`).
4. Push a la rama (`git push origin feature/AmazingFeature`).
5. Abre un Pull Request.

---

<div align="center">
<small>Desarrollado con ❤️ para la <b>Universidad Central del Ecuador</b></small>





<small>2025 - 2026 © Todos los derechos reservados</small>
</div>
