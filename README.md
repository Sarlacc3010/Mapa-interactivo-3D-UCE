# 🗺️ 3D Interactive Map - Universidad Central del Ecuador (UCE)

An interactive web platform that allows users to visualize the UCE campus in 3D, manage academic events, explore faculties, and manage institutional information through an advanced control panel.

---

## 🚀 Key Features

* **Interactive 3D Map:** Immersive navigation using **React Three Fiber**.
* **Event Management:** Complete CRUD system to create, edit, and delete events linked to faculties.
* **Administrative Panel:**
* Dashboard with metrics and charts (Recharts).
* Location and event management.
* Role-based authentication (Admin/User).


* **Smart Search:** Filter faculties and services by name or category.
* **Hybrid Authentication:** Traditional Login (Email/Password) and **Google OAuth**.
* **Real-Time Information:** Visualization of schedules, descriptions, and future events via Pop-ups.
* **Robust Architecture:**
* **PostgreSQL:** Relational data (Users, Events, Visits).
* **MongoDB:** Building metadata and flexible configurations.
* **Redis:** Caching system to optimize location loading.
* **Docker:** Full containerization of the development environment.



---

## 🛠️ Technologies Used

### Frontend

* **React + Vite:** Fast development environment.
* **Tailwind CSS:** Modern and responsive styling.
* **React Three Fiber (Drei):** 3D rendering on the web.
* **Lucide React:** Iconography.
* **Recharts:** Data visualization and statistics.

### Backend

* **Node.js + Express:** RESTful API server.
* **PostgreSQL (pg):** Main database.
* **MongoDB (Mongoose):** Secondary database (NoSQL).
* **Redis:** Cache and session management.
* **Passport.js:** Authentication strategies (JWT + Google).
* **Multer:** Local image upload management.

### Infrastructure (Docker)

* **Docker Compose:** Service orchestration.
* **PgAdmin 4:** Visual management for PostgreSQL.
* **Mongo Express:** Visual management for MongoDB.

---

## 📋 Prerequisites

Before starting, make sure you have installed:

1. **Docker Desktop** (with Docker Compose).
2. **Git**.
3. **Node.js** (Optional, only if you want to run local commands outside Docker).

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

git clone <YOUR_REPOSITORY_URL>
cd uce-mapa-3d

### 2. Environment Variables Configuration

Create a `.env` file inside the `Backend/` folder with the following content.
*(Make sure to change the Google credentials to your own)*.

env
# --- SQL DATABASE (Postgres) ---
DB_HOST=postgres_db
DB_USER=admin_sql
DB_PASSWORD=password_sql
DB_NAME=uce_main_db
DB_PORT=5432

# --- NOSQL DATABASE (Mongo) ---
MONGO_URI=mongodb://admin_mongo:password_mongo@mongo_db:27017/uce_nosql_db?authSource=admin

# --- REDIS (Cache) ---
REDIS_HOST=redis_cache
REDIS_PORT=6379

# --- SECURITY ---
JWT_SECRET=your_super_secure_secret_change_this

# --- GOOGLE OAUTH ---
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here


### 3. Prepare Image Folder

For image persistence to work correctly, create the folder in the project root:

mkdir uploads


*Note: Images saved here will automatically sync with the Backend container.*

### 4. Run the Project with Docker

Start all services (Frontend, Backend, Databases, Viewers) with a single command:

docker-compose up -d --build


*The `--build` flag is important the first time to install dependencies.*

---

## 🗄️ Database Initialization (SQL)

Once the containers are running, you need to create the tables in PostgreSQL.

1. Open **PgAdmin** in your browser: `http://localhost:5050`
* **Email:** `admin-mapa@uce.edu.ec`
* **Password:** `admin`


2. Connect to the server (Host: `postgres_db`, User: `admin_sql`, Pass: `password_sql`).
3. Open the **Query Tool** on the `uce_main_db` database and run this script:

sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin' or 'user'
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table (Synced with Frontend IDs)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    image_url TEXT,
    schedule VARCHAR(100)
);

-- Events Table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    location_id INTEGER REFERENCES locations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User (Password: 123456)
-- Note: In production use the app registration so the password gets hashed.
INSERT INTO locations (id, name, category) VALUES (6, 'Facultad de Ingeniería y Ciencias Aplicadas', 'Académico');

---

## 🖥️ Accessing the Application

Once deployed, you can access the following services:

| Service | Local URL | Description |
| --- | --- | --- |
| **Web App (Frontend)** | `http://localhost:5173` | Main application (Map). |
| **API (Backend)** | `http://localhost:5000` | Data server. |
| **PgAdmin 4** | `http://localhost:5050` | Visual manager for PostgreSQL. |
| **Mongo Express** | `http://localhost:8081` | Visual manager for MongoDB. |

---

## 📂 Project Structure

/
├── Backend/
│   ├── config/             # DB Connections (Mongo, Redis)
│   ├── models/             # Mongoose Models
│   ├── public/uploads/     # Mapped folder for images
│   ├── routes/             # API Routes (locations, events)
│   ├── index.js            # Server entry point
│   └── Dockerfile
│
├── Frontend/
│   ├── src/
│   │   ├── components/     # UI (Cards, Popups, Dashboard)
│   │   ├── hooks/          # Custom Hooks (useLocations)
│   │   ├── Campus3D.jsx    # 3D Model
│   │   └── App.jsx         # Main Component
│   └── Dockerfile
│
├── uploads/                # Local folder for image persistence
└── docker-compose.yml      # Container orchestration


---

## ✨ How to Use

1. **Explore:** Go to `localhost:5173`. Use the mouse to rotate and zoom in on the campus.
2. **Search:** Click on the magnifying glass to search for specific faculties.
3. **View Details:** Click on a 3D building or a search result to view its information card.
4. **Admin Login:**
* Register or log in with Google.
* If your user has the `admin` role (you can manually change this in the DB for now), you will see the gear button in the top right corner.


5. **Admin Panel:**
* View visit statistics.
* Create new events by selecting the faculty.
* Edit or delete existing events.



---

## 🐛 Troubleshooting Common Issues

* **DB Connection Error:** Ensure that the `postgres_db` and `mongo_db` containers are in "Healthy" or "Running" state.
* **CORS Error:** If you see errors in the browser console, verify that `Backend/index.js` has `app.use(cors())` configured.
* **Images not loading:** Verify that the `uploads` folder exists in the root and has read/write permissions.

---

Developed for **Universidad Central del Ecuador**. 🎓
