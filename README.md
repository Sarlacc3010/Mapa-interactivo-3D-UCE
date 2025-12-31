# 🎓 Campus Virtual 3D - Universidad Central del Ecuador (UCE)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/estado-En_Desarrollo-yellow)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_Three_Fiber-61DAFB?logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

> Una plataforma interactiva inmersiva que permite a estudiantes y visitantes explorar la Universidad Central del Ecuador en un entorno 3D. El sistema integra **Geofencing** para registrar visitas automáticas y notificar eventos académicos basándose en la proximidad del usuario dentro del mundo virtual.

---

## 📸 Demo y Capturas

![Vista del Campus 3D](./screenshots/demo_mapa.png)
*(Reemplaza esta ruta con una captura real de tu proyecto)*

---

## ✨ Características Principales

### 🗺️ Experiencia 3D Inmersiva
* Navegación fluida por el campus utilizando modelos GLB optimizados.
* Renderizado de alto rendimiento con **React Three Fiber**.
* Interacción con edificios (clic para ver detalles e historia).

### 📍 Sistema de Geofencing (Proximidad)
El sistema calcula la distancia en tiempo real entre el avatar del usuario y los edificios:
* **🔔 Alertas de Eventos (< 15 metros):** Si hay un evento activo en una facultad cercana, aparece una notificación emergente automática.
* **📝 Registro de Visitas (< 8 metros):** Se registra automáticamente la visita del usuario en la base de datos SQL para análisis de tráfico estudiantil.

### 🔐 Seguridad y Gestión
* **Autenticación JWT:** Sistema seguro de Login y Registro.
* **Roles de Usuario:** Diferenciación entre Estudiantes y Administradores.
* **Dashboard Administrativo:** (En desarrollo) Para crear eventos y ver estadísticas.

---

## 🛠️ Stack Tecnológico

Este proyecto utiliza una arquitectura de microservicios contenerizada:

| Área | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | SPA rápida y moderna. |
| **3D Engine** | React Three Fiber / Drei | Abstracción de Three.js para React. |
| **Estilos** | Tailwind CSS | Diseño responsivo y moderno. |
| **Backend** | Node.js + Express | API RESTful. |
| **Base de Datos 1** | PostgreSQL | Manejo relacional (Usuarios, Eventos, Logs de Visitas). |
| **Base de Datos 2** | MongoDB | Datos no estructurados (Información detallada de facultades). |
| **DevOps** | Docker & Docker Compose | Orquestación de contenedores para despliegue. |
| **Herramientas** | PgAdmin 4 & Mongo Express | Gestión visual de bases de datos. |

---

## 🚀 Instalación y Despliegue

### Prerrequisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.
* [Git](https://git-scm.com/) instalado.

### 1. Clonar el repositorio
```bash
git clone https://github.com/Sarlacc3010/Mapa-interactivo-3D-UCE.git
cd Mapa-interactivo-3D-UCE
