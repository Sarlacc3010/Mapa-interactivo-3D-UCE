# 🎨 Wireframe Image Generation Guide

## Overview

This guide provides instructions for creating visual wireframe images to complement the ASCII wireframes in the Design Process documentation.

---

## 📋 Wireframes to Generate

### 1. Login Screen Wireframe
**Filename**: `wireframe-login.png`  
**Size**: 1920x1080  
**Description**: Clean login interface with UCE branding

**Elements to include:**
- UCE logo centered at top
- Email input field
- Password input field
- "Iniciar Sesión" button
- Google OAuth button
- "Registrarse" and "¿Olvidaste tu contraseña?" links
- Minimal, professional design

---

### 2. Campus 3D View Wireframe
**Filename**: `wireframe-campus-view.png`  
**Size**: 1920x1080  
**Description**: Main 3D campus interface layout

**Elements to include:**
- Top navigation bar (logo, search, theme toggle, user menu)
- Large 3D viewport area (center, 70% of screen)
- Building info card (bottom-left)
- Mode toggle buttons (bottom-right)
- Zoom controls (bottom-right)
- Search results dropdown (if search active)

---

### 3. FPS Mode Wireframe
**Filename**: `wireframe-fps-mode.png`  
**Size**: 1920x1080  
**Description**: First-person perspective layout

**Elements to include:**
- Full-screen 3D view
- Crosshair in center
- Building info card (bottom-left, appears on proximity)
- Control hints (bottom, WASD, Shift, Esc)
- Exit to satellite button (bottom-right)

---

### 4. Events Modal Wireframe
**Filename**: `wireframe-events-modal.png`  
**Size**: 1920x1080  
**Description**: Events list modal overlay

**Elements to include:**
- Modal overlay (centered, 60% width)
- Header with building name and close button
- Filter tabs (Todos, Hoy, Esta Semana, Este Mes)
- Event cards (3-4 visible)
  - Event title
  - Time and date
  - Location
  - Organizer
  - Subscribe button
- Scrollable list indicator

---

### 5. Admin Dashboard Wireframe
**Filename**: `wireframe-admin-dashboard.png`  
**Size**: 1920x1080  
**Description**: Admin control panel layout

**Elements to include:**
- Left sidebar navigation
  - Logo
  - Menu items (Dashboard, Analytics, Events, Locations, Users)
  - Settings
  - Logout
- Main content area
  - Header with page title
  - Metric cards (3 cards: Visits, Events, Users)
  - Visit distribution chart (bar chart)
  - Upcoming events table
  - Quick action buttons

---

### 6. My Agenda Wireframe
**Filename**: `wireframe-my-agenda.png`  
**Size**: 1920x1080  
**Description**: Student personal calendar

**Elements to include:**
- Header "Mi Agenda"
- Filter options (date range, category)
- Calendar view or list view toggle
- Event cards with:
  - Event name
  - Date and time
  - Location
  - Unsubscribe button
- Empty state (if no events)

---

## 🛠️ Tools for Creating Wireframes

### Option 1: Figma (Recommended)
1. Create new Figma file
2. Use 1920x1080 frame
3. Use wireframe kit: [Figma Wireframe Kit](https://www.figma.com/community/file/809906474847045638)
4. Export as PNG (2x resolution)

### Option 2: Excalidraw
1. Go to [excalidraw.com](https://excalidraw.com/)
2. Create wireframe with hand-drawn style
3. Export as PNG

### Option 3: Balsamiq
1. Use Balsamiq Cloud or Desktop
2. Create low-fidelity wireframes
3. Export as PNG

### Option 4: AI Generation (Quick)
Use the `generate_image` tool with prompts like:

```
"Clean, professional wireframe mockup of a login screen for a university campus 3D map application. 
Include: centered UCE logo, email and password input fields, login button, Google OAuth button, 
and registration link. Minimalist design, grayscale, 1920x1080 resolution."
```

---

## 🎨 Wireframe Design Guidelines

### Style
- **Grayscale**: Use shades of gray (no colors)
- **Simple Shapes**: Rectangles, circles, lines
- **Placeholder Text**: Lorem ipsum or descriptive labels
- **Icons**: Simple line icons or placeholders
- **Annotations**: Add labels for interactive elements

### Layout
- **Grid System**: 12-column grid
- **Spacing**: Consistent padding and margins
- **Hierarchy**: Clear visual hierarchy
- **Alignment**: Proper alignment of elements

### Typography
- **Headings**: Bold, larger size
- **Body**: Regular weight
- **Labels**: Smaller, uppercase for emphasis
- **Placeholder**: Lighter gray

---

## 📸 Example Prompts for AI Generation

### Login Screen
```
Professional wireframe mockup of a university login page. 
Layout: Centered card with UCE logo at top, email input field, 
password input field, blue 'Iniciar Sesión' button, 
'Continue with Google' button below, and small 'Registrarse' 
and 'Olvidaste contraseña' links at bottom. 
Clean, minimal, grayscale wireframe style. 1920x1080.
```

### Campus 3D View
```
Wireframe mockup of a 3D campus map interface. 
Layout: Top navigation bar with logo, search bar, and user menu. 
Large central area for 3D viewport (placeholder with '3D Campus Model' text). 
Bottom-left: building information card. 
Bottom-right: mode toggle buttons and zoom controls. 
Professional wireframe style, grayscale. 1920x1080.
```

### Admin Dashboard
```
Wireframe mockup of an admin dashboard. 
Layout: Left sidebar with navigation menu items. 
Main area: header with 'Dashboard' title, three metric cards 
(Visits, Events, Users), bar chart showing visit distribution, 
and table of upcoming events. 
Clean, professional wireframe style, grayscale. 1920x1080.
```

---

## 📁 File Organization

Save wireframes in:
```
/docs/wireframes/
  ├── wireframe-login.png
  ├── wireframe-campus-view.png
  ├── wireframe-fps-mode.png
  ├── wireframe-events-modal.png
  ├── wireframe-admin-dashboard.png
  └── wireframe-my-agenda.png
```

Upload to Backblaze:
```
Bucket: uce-campus-3d-assets
Folder: wireframes/
```

---

## 🔗 Embedding in README

Add wireframes section to README:

```markdown
## 🎨 Design Process

### Wireframes

#### Login Screen
![Login Wireframe](https://f002.backblazeb2.com/file/uce-campus-3d-assets/wireframes/wireframe-login.png)

#### Campus 3D View
![Campus View Wireframe](https://f002.backblazeb2.com/file/uce-campus-3d-assets/wireframes/wireframe-campus-view.png)

#### Admin Dashboard
![Admin Dashboard Wireframe](https://f002.backblazeb2.com/file/uce-campus-3d-assets/wireframes/wireframe-admin-dashboard.png)

[View Full Design Process Documentation](./docs/DESIGN_PROCESS.md)
```

---

## ✅ Wireframe Checklist

- [ ] wireframe-login.png
- [ ] wireframe-campus-view.png
- [ ] wireframe-fps-mode.png
- [ ] wireframe-events-modal.png
- [ ] wireframe-admin-dashboard.png
- [ ] wireframe-my-agenda.png

---

## 🚀 Next Steps

1. Generate wireframe images using preferred tool
2. Optimize images (< 200KB each)
3. Upload to Backblaze B2
4. Update README with wireframe section
5. Link to full design process documentation

---

**Note**: Wireframes are intentionally simple and grayscale to focus on layout and functionality, not visual design. The actual screenshots will show the final, polished UI.
