<div align="center">

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
    <a href="./README.md">🇺🇸 Read in English</a>
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

## 🖼️ Capturas de Pantalla

> **Nota**: Las capturas de pantalla pueden alojarse en Backblaze B2 para un rendimiento óptimo

| Vista Satelital | Modo Primera Persona |
|:---:|:---:|
| ![Vista Satelital](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/satellite-view.jpg) | ![Modo FPS](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/fps-mode.jpg) |
| **Tarjeta de Información del Edificio** | **Modal de Eventos** |
| ![Info Edificio](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/building-info.jpg) | ![Eventos](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/events-modal.jpg) |
| **Panel de Administración** | **Analíticas** |
| ![Panel](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/admin-dashboard.jpg) | ![Analíticas](https://ubicaciones-mapa-uce.s3.us-east-005.backblazeb2.com/ScreenShots/analytics.jpg) |

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
