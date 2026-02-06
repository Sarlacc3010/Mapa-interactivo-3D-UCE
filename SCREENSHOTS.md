# 📸 Complete Screenshot List for README

## Required Screenshots for Backblaze B2

### 1. User Interface (Main Features)

#### `satellite-view.png`
- **Description**: Full campus view from above with orbital controls
- **Resolution**: 1920x1080
- **What to show**: 
  - Complete 3D campus model
  - Orbital controls visible
  - Clear day lighting
  - Some buildings labeled

#### `fps-mode.png`
- **Description**: First-person ground-level exploration
- **Resolution**: 1920x1080
- **What to show**:
  - Ground-level perspective
  - Crosshair/mira visible
  - WASD control hints
  - Building in view

#### `building-info.png`
- **Description**: Building information card displayed
- **Resolution**: 1920x1080
- **What to show**:
  - Info card with building details
  - Open/Closed status indicator
  - Operating hours
  - "Ver Eventos" button visible

#### `events-modal.png`
- **Description**: Events modal with event list
- **Resolution**: 1920x1080
- **What to show**:
  - Modal overlay with events
  - Multiple events listed
  - Event details (time, date, location)
  - Subscribe buttons

#### `my-agenda.png`
- **Description**: Student personal calendar
- **Resolution**: 1920x1080
- **What to show**:
  - Calendar view with subscribed events
  - Event cards
  - Filter options
  - "Mis Eventos Suscritos" header

#### `search-feature.png`
- **Description**: Search functionality in action
- **Resolution**: 1920x1080
- **What to show**:
  - Search bar with query
  - Search results dropdown
  - Building/faculty suggestions

---

### 2. Authentication & User Management

#### `login-screen.png`
- **Description**: Login page
- **Resolution**: 1920x1080
- **What to show**:
  - Email/password fields
  - "Iniciar Sesión" button
  - Google OAuth button
  - "Registrarse" link
  - UCE logo

#### `register-screen.png`
- **Description**: Registration form
- **Resolution**: 1920x1080
- **What to show**:
  - Registration form fields (name, email, password, faculty)
  - Faculty dropdown
  - "Registrarse" button
  - "Ya tengo cuenta" link

#### `email-verification.png`
- **Description**: Email verification screen
- **Resolution**: 1920x1080
- **What to show**:
  - Verification message
  - Email icon
  - Instructions
  - "Reenviar email" option

#### `password-recovery.png`
- **Description**: Password reset flow
- **Resolution**: 1920x1080
- **What to show**:
  - "Recuperar Contraseña" form
  - Email input field
  - "Enviar enlace" button

---

### 3. Admin Dashboard

#### `admin-dashboard.png`
- **Description**: Admin dashboard overview
- **Resolution**: 1920x1080
- **What to show**:
  - Sidebar navigation
  - Dashboard tab active
  - Overview statistics cards
  - Charts visible

#### `analytics-tab.png`
- **Description**: Analytics section with charts
- **Resolution**: 1920x1080
- **What to show**:
  - Visit distribution chart
  - Event metrics
  - Bar/pie charts
  - Date range selector

#### `events-management.png`
- **Description**: Events CRUD interface
- **Resolution**: 1920x1080
- **What to show**:
  - Events table/list
  - "Crear Evento" button
  - Edit/Delete actions
  - Search/filter options

#### `locations-management.png`
- **Description**: Locations/Buildings management
- **Resolution**: 1920x1080
- **What to show**:
  - Locations list
  - Building details
  - Edit interface
  - Operating hours configuration

#### `user-management.png`
- **Description**: User administration panel
- **Resolution**: 1920x1080
- **What to show**:
  - Users table
  - Role assignments
  - User actions (edit, delete)
  - Filter by role

#### `reports-export.png`
- **Description**: Reports generation and export
- **Resolution**: 1920x1080
- **What to show**:
  - Report type selector
  - Date range picker
  - Export buttons (CSV, PDF)
  - Preview of data

---

### 4. Database Management Tools

#### `pgadmin-interface.png`
- **Description**: PgAdmin dashboard
- **Resolution**: 1920x1080
- **What to show**:
  - PgAdmin main interface
  - Server connection tree
  - Database "uce_main_db" visible
  - Tables listed

#### `redis-commander.png`
- **Description**: Redis Commander interface
- **Resolution**: 1920x1080
- **What to show**:
  - Redis Commander UI
  - Key-value pairs visible
  - "locations:all" or similar cache key
  - Value preview

#### `database-schema.png`
- **Description**: Database schema visualization
- **Resolution**: 1920x1080
- **What to show**:
  - ERD or table structure
  - Tables: users, locations, events, visits
  - Relationships visible

#### `query-tool.png`
- **Description**: SQL query interface in PgAdmin
- **Resolution**: 1920x1080
- **What to show**:
  - Query editor with sample SQL
  - Query results table
  - Execution time
  - Row count

---

### 5. Theme Variations

#### `dark-theme.png`
- **Description**: Application in dark mode
- **Resolution**: 1920x1080
- **What to show**:
  - Any main view in dark theme
  - Dark background
  - Contrast elements
  - Theme toggle visible

#### `light-theme.png`
- **Description**: Application in light mode
- **Resolution**: 1920x1080
- **What to show**:
  - Same view as dark-theme but in light mode
  - Light background
  - Good contrast

---

## Summary Checklist

### User Interface (6 screenshots)
- [ ] satellite-view.png
- [ ] fps-mode.png
- [ ] building-info.png
- [ ] events-modal.png
- [ ] my-agenda.png
- [ ] search-feature.png

### Authentication (4 screenshots)
- [ ] login-screen.png
- [ ] register-screen.png
- [ ] email-verification.png
- [ ] password-recovery.png

### Admin Dashboard (6 screenshots)
- [ ] admin-dashboard.png
- [ ] analytics-tab.png
- [ ] events-management.png
- [ ] locations-management.png
- [ ] user-management.png
- [ ] reports-export.png

### Database Tools (4 screenshots)
- [ ] pgadmin-interface.png
- [ ] redis-commander.png
- [ ] database-schema.png
- [ ] query-tool.png

### Theme Variations (2 screenshots)
- [ ] dark-theme.png
- [ ] light-theme.png

---

## Total: 20 Screenshots

### Priority Levels

**High Priority (Must Have):**
1. satellite-view.png
2. fps-mode.png
3. building-info.png
4. events-modal.png
5. login-screen.png
6. admin-dashboard.png
7. analytics-tab.png
8. pgadmin-interface.png

**Medium Priority (Should Have):**
9. my-agenda.png
10. register-screen.png
11. events-management.png
12. locations-management.png
13. dark-theme.png

**Low Priority (Nice to Have):**
14. search-feature.png
15. email-verification.png
16. password-recovery.png
17. user-management.png
18. reports-export.png
19. redis-commander.png
20. database-schema.png
21. query-tool.png
22. light-theme.png

---

## Backblaze Upload Instructions

1. **Optimize images** using TinyPNG before upload
2. **Upload to bucket**: `uce-campus-3d-assets`
3. **Get public URLs** for each image
4. **Update README.md** with actual URLs
5. **Test all links** to ensure they load correctly

## URL Format

```
https://f002.backblazeb2.com/file/uce-campus-3d-assets/[filename].png
```

Example:
```
https://f002.backblazeb2.com/file/uce-campus-3d-assets/satellite-view.png
```
