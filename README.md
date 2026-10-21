# PG Finder Platform

An enterprise-grade full-stack Paying Guest (PG) and co-living accommodation discovery and booking management platform connecting prospective tenants, property owners, and platform administrators.

---

## 1. System Architecture

The application is structured as a decoupled client-server architecture:

```
[ Web Browser ]
      |
      +---> [ React 18 + Vite Frontend (Port 5173) ]
                  |
                  |-- HTTP / REST (Axios + TanStack Query)
                  |-- WebSocket (Socket.IO Client)
                  v
[ Node.js + Express API Gateway (Port 5000) ]
      |
      |-- Authentication: JWT in HTTP-only, SameSite Cookies
      |-- Database: MongoDB Atlas (Mongoose ODM)
      |-- Media Storage: Cloudinary Multi-image Pipeline
      |-- Real-time Engine: Socket.IO Event Server
      +-- Notification Engine: Nodemailer SMTP Delivery
```

### Technology Stack
* **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, TanStack Query (React Query v5), React Hook Form, Zod, Lucide React, Leaflet & React-Leaflet.
* **Backend**: Node.js (ES Modules), Express.js, MongoDB Atlas with Mongoose ODM, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `express-rate-limit`, `helmet`, `cors`, `morgan`.
* **Real-Time & Communication**: Socket.IO for bidirectional live messaging and push notifications; Nodemailer with SMTP transport for automated transactional emails.
* **Media Management**: Cloudinary CDN for property image gallery uploads.

---

## 2. Directory Structure

```
PG-Finder/
├── client/                          # React + Vite Frontend Client
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── booking/             # Booking modals & status badges
│   │   │   ├── common/              # Header, footer, and navigation
│   │   │   ├── search/              # Search filters, Leaflet map, PG cards
│   │   │   └── ui/                  # Reusable form & display primitives
│   │   ├── context/                 # AuthContext & SocketContext
│   │   ├── layouts/                 # MainLayout wrapper
│   │   ├── pages/                   # Application route views
│   │   │   ├── auth/                # Login, Register, Forgot & Reset Password
│   │   │   ├── chat/                # Real-time Chat & messaging
│   │   │   ├── dashboards/          # Tenant, Owner, and Admin dashboards
│   │   │   ├── owner/               # PG form, Room inventory, Booking requests
│   │   │   ├── pg/                  # Public PG details & verified reviews
│   │   │   ├── search/              # Discovery, filters & interactive map
│   │   │   ├── tenant/              # Tenant booking management
│   │   │   └── wishlist/            # Saved accommodations portal
│   │   ├── routes/                  # ProtectedRoute, RoleRoute, AppRoutes
│   │   ├── services/                # Axios API clients for each module
│   │   └── App.jsx                  # Root component
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Express.js REST API & Socket.IO Server
│   ├── scripts/                     # Automated integration test scripts
│   ├── src/
│   │   ├── config/                  # Environment config, DB, Cloudinary
│   │   ├── controllers/             # Request handlers for all platform domains
│   │   ├── middleware/              # Auth, RBAC, Rate limiters, Error handler
│   │   ├── models/                  # Mongoose schemas (User, PG, Room, Booking, Review, Notification, Conversation, Message)
│   │   ├── routes/                  # Modular route declarations
│   │   ├── services/                # Business logic, aggregation pipelines, emails
│   │   ├── utils/                   # Notification hooks, token cookies, API response helpers
│   │   ├── validators/              # Zod input validation schemas
│   │   └── server.js                # Server entry point & Socket.IO initialization
│   ├── package.json
│   └── .env
│
└── README.md                        # Documentation & setup guide
```

---

## 3. Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pg_finder?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
ADMIN_EMAIL=a.niranjan244@gmail.com
ADMIN_PASSWORD=Niranjan1
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 4. Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0
* A running **MongoDB Atlas** cluster or local MongoDB instance

### Installation & Execution

#### 1. Start the Backend API
```bash
cd server
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

#### 2. Start the Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
The client will be accessible at `http://localhost:5173`.

---

## 5. REST API Reference

All protected endpoints require an authenticated session via the HTTP-only `token` cookie.

### Authentication & Password Reset (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`tenant` or `owner`) |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear authentication cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session user profile |
| `POST` | `/api/auth/forgot-password` | Public | Generate reset token and dispatch email link |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid reset token |

### Public PG Discovery (`/api/pgs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pgs/search` | Public | Multi-criteria search with bounding-box geospatial filters |
| `GET` | `/api/pgs/:id` | Public | Fetch public accommodation details, room configurations, and rating |

### Property Owner Management (`/api/owner/pgs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/owner/pgs` | Owner, Admin | List owner's created properties with vacancy summaries |
| `POST` | `/api/owner/pgs` | Owner, Admin | Submit new PG listing (starts in `pending` status) |
| `GET` | `/api/owner/pgs/:id` | Owner, Admin | Get single owned PG details |
| `PUT` | `/api/owner/pgs/:id` | Owner, Admin | Update property details |
| `DELETE` | `/api/owner/pgs/:id` | Owner, Admin | Delete property and associated room inventory |
| `POST` | `/api/owner/pgs/upload` | Owner, Admin | Upload gallery images via Cloudinary pipeline |
| `POST` | `/api/owner/pgs/:id/rooms` | Owner, Admin | Add new room configuration with bed capacity |
| `PUT` | `/api/owner/pgs/:id/rooms/:roomId`| Owner, Admin | Update room details, rent, or capacity |
| `DELETE`| `/api/owner/pgs/:id/rooms/:roomId`| Owner, Admin | Remove a room from the inventory |

### Bookings Pipeline (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Tenant | Request a booking for a specific room |
| `GET` | `/api/bookings/my` | Tenant | List tenant's booking requests with status |
| `GET` | `/api/bookings/owner` | Owner, Admin | List booking requests submitted for owned properties |
| `PATCH`| `/api/bookings/:id/approve` | Owner, Admin | Approve request (decrements vacancy, triggers email & notification) |
| `PATCH`| `/api/bookings/:id/reject` | Owner, Admin | Reject request with reason (triggers email & notification) |
| `PATCH`| `/api/bookings/:id/cancel` | Authenticated | Cancel booking request |

### Real-Time Chat (`/api/chat`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/start` | Authenticated | Create or retrieve conversation thread for a PG |
| `GET` | `/api/chat/conversations` | Authenticated | List user's active conversation threads with unread counts |
| `GET` | `/api/chat/conversations/:id/messages` | Authenticated | Fetch message history for a conversation |
| `POST` | `/api/chat/conversations/:id/messages` | Authenticated | Send message (persists & pushes via Socket.IO) |
| `PATCH`| `/api/chat/conversations/:id/read` | Authenticated | Mark conversation as read |
| `GET` | `/api/chat/unread-count` | Authenticated | Get total unread messages across all threads |

### Saved Properties / Wishlist (`/api/wishlist`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/wishlist/:pgId/toggle` | Authenticated | Add or remove property from user's wishlist |
| `GET` | `/api/wishlist` | Authenticated | Retrieve paginated saved accommodations |
| `GET` | `/api/wishlist/ids` | Authenticated | Retrieve array of saved PG IDs for UI heart badges |

### Verified Resident Reviews (`/api/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews/pg/:pgId` | Tenant (Verified) | Submit review (requires approved booking; recalculates average rating) |
| `GET` | `/api/reviews/pg/:pgId` | Public | List verified resident reviews for a property |
| `GET` | `/api/reviews/pg/:pgId/eligibility` | Authenticated | Check if current tenant has an approved stay and can review |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | List recent notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get unread notification count for header badge |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark single notification as read |
| `PATCH`| `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

### Administration & Governance (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Overview KPI metrics |
| `GET` | `/api/admin/pgs` | Admin | Moderation queue with status filter |
| `PATCH`| `/api/admin/pgs/:id/status` | Admin | Approve or reject listing with mandatory reason |
| `DELETE`| `/api/admin/pgs/:id` | Admin | Permanently remove/delist an infringing property |
| `GET` | `/api/admin/users` | Admin | Search and filter platform users by role |
| `PATCH`| `/api/admin/users/:id/block` | Admin | Instant block / unblock toggle for account governance |

---

## 6. Pre-Configured Test Personas

All accounts are standardized with the password `Password123` (Admin: `Niranjan1`):

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `a.niranjan244@gmail.com` | `Niranjan1` | Full administrative authority & moderation |
| **PG Owner** | `nani123@gmail.com` | `Password123` | Owns "Good PG" & manages room allocations |
| **Verified Resident** | `nana123@gmail.com` | `Password123` | Approved booking resident eligible to leave reviews |
| **General Tenant** | `venkat.sai785@gmail.com` | `Password123` | Searches PGs, creates booking requests, chats |

---

## 7. Automated Verification

Execute the end-to-end integration test suite to verify all core flows:

```bash
cd server
node scripts/testPhase7.js
```

---

## 8. Theme Rules & Color Tokens (Theme Architecture)

To maintain consistent, accessible, and high-contrast dark and light themes across the platform, follow these strict rules whenever creating or modifying UI components:

### A. Semantic Color Tokens
Never use fixed Tailwind colors (such as `bg-white`, `text-black`, `bg-slate-900`, `border-slate-200`) in new components. Instead, always use the semantic theme tokens configured in `tailwind.config.js`:

| Token Class | Light Value | Dark Value | Intended Usage |
| :--- | :--- | :--- | :--- |
| `bg-theme-bg` | `#f8fafc` | `#0f172a` | Full page / screen background |
| `bg-theme-surface` | `#ffffff` | `#1e293b` | Cards, modals, drawers, dropdown menus |
| `bg-theme-surface-hover` | `#f1f5f9` | `#334155` | Table rows hover, list item hover |
| `bg-theme-surface-subtle` | `#f8fafc` | `#162032` | Table headers, secondary card panels |
| `border-theme-border` | `#e2e8f0` | `#334155` | Subtle dividers, card borders, input borders |
| `text-theme-primary` | `#0f172a` | `#f8fafc` | Headings, titles, primary body text |
| `text-theme-secondary` | `#475569` | `#cbd5e1` | Subtitles, descriptions, metadata |
| `text-theme-muted` | `#64748b` | `#94a3b8` | Placeholders, captions, timestamps |
| `text-theme-brand` | `#026fc7` | `#38a8f8` | Links, primary highlights |

### B. Strict Quality Rules
1. **No Pure Black (#000) or Pure White (#fff) Text**: Soft dark slates (`#0f172a`, `#1e293b`) prevent eye strain and glare in dark environments.
2. **WCAG AA Contrast**: Ensure minimum contrast ratios of 4.5:1 for body copy and 3:1 for large headers.
3. **Form Controls**: Use `bg-theme-surface border border-theme-border text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-brand-500` for all text fields, selects, and textareas.
4. **Interactive Maps (Leaflet)**: Automatically swap tile layers between CARTO Voyager (light) and CARTO Dark Matter (`dark_all`) based on the active theme (`useTheme().isDark`).
5. **No Layout Shift**: Theme switches use a 150ms color transition on backgrounds and text without altering element box models or spacing.

