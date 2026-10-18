# 💬 ChatApp — Real-Time Multi-Room WebSocket Chat

A sleek, minimalist real-time chat application built with **React 19**, **TypeScript**, **Vite**, and **Node.js WebSockets**. Create or join private rooms using 6-digit alphanumeric codes and enjoy instant, low-latency messaging with automatic per-user color assignments and live presence notifications.

---

## ✨ Features

- **⚡ Instant Real-Time Messaging**: Built on raw, high-performance WebSockets (`ws`) for sub-millisecond message delivery.
- **🔑 6-Digit Room System**: Generate unique, cryptographically-backed 6-character room codes (`[0-9A-Z]`) or join any existing room instantly.
- **🎨 Dynamic Per-User Themes**: Every user in the chat room is automatically assigned a distinct high-contrast color scheme (12 curated themes + Golden Angle HSL for infinite participants).
- **🔔 Live Presence Indicators**: Centered, subtle system notifications whenever a new user joins or leaves the room.
- **🖤 Minimalist Dark UI**: Engineered with JetBrains Mono typography, subtle borders, and smooth micro-animations.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile screens.
- **🔒 Secure & Clean Architecture**: Environment variables for flexible local development and production deployments.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom design system with CSS tokens)
- **Typography**: JetBrains Mono via Google Fonts

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **WebSocket Engine**: [`ws`](https://github.com/websockets/ws)
- **Configuration**: [`dotenv`](https://github.com/motdotla/dotenv)

---

## 📂 Project Structure

```text
chatApp/
├── Backend/
│   ├── src/
│   │   └── index.ts          # WebSocket server, room state & message routing
│   ├── .env                  # Backend environment variables (PORT)
│   ├── .env.example          # Environment template
│   ├── package.json          # Backend scripts & dependencies
│   └── tsconfig.json         # TypeScript compiler config
│
├── Frontend/
│   ├── public/
│   │   └── favicon.svg       # Minimalist chat bubble favicon
│   ├── src/
│   │   ├── utils/
│   │   │   └── random.ts     # Room code generator & per-user color algorithm
│   │   ├── App.css           # Component styles & dark theme tokens
│   │   ├── App.tsx           # Main chat client & WebSocket manager
│   │   ├── index.css         # Global CSS reset & variables
│   │   └── main.tsx          # React application entrypoint
│   ├── .env                  # Frontend environment variables (VITE_WS_URL)
│   ├── .env.example          # Environment template
│   ├── index.html            # HTML5 template
│   ├── package.json          # Frontend scripts & dependencies
│   └── vite.config.ts        # Vite configuration
│
└── .gitignore                # Root gitignore protecting secrets & builds
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/Aryan-artist/chatApp.git
cd chatApp
```

### 2. Setup & Start Backend
```bash
cd Backend
npm install
npm run dev
```
*The WebSocket server will start on `ws://localhost:8080`.*

### 3. Setup & Start Frontend
Open a new terminal window:
```bash
cd Frontend
npm install
npm run dev
```
*Visit `http://localhost:5173` in your browser.*

---

## ⚙️ Environment Variables

### Backend (`Backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port for the WebSocket server to listen on |

### Frontend (`Frontend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_WS_URL` | `ws://localhost:8080` | WebSocket endpoint URL (`wss://...` in production) |

---

## 🌐 Production Deployment

- **Backend**: Deploy as a Web Service on **[Render](https://render.com)** or **[Railway](https://railway.app)**:
  - Root Directory: `Backend`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
- **Frontend**: Deploy on **[Vercel](https://vercel.com)**:
  - Root Directory: `Frontend`
  - Environment Variable: `VITE_WS_URL = wss://<your-backend-domain>.onrender.com`

---

## 📄 License
This project is open source and available under the [ISC License](LICENSE).
