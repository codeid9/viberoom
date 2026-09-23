# 🎉 VibeRoom

**VibeRoom** is a private social hangout platform built for friends to chat, watch YouTube content, and enjoy a shared online space together.

The project is being built as a **full-stack TypeScript monorepo** with real-time communication and a secure backend.

> 🚧 **VibeRoom is currently under active development.**

---

## ✨ Planned Features

* 💬 Real-time chat
* ▶️ YouTube integration
* 👥 Private friends/community access
* 🔐 Authentication & authorization
* 🟢 Online/offline user status
* 👑 Admin panel
* 🗄️ MongoDB-backed chat and user data
* 🧹 Admin-controlled data management
* 📱 Responsive UI
* 🔒 Secure API and WebSocket communication

More features may be added as development continues.

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Node.js
* Express
* TypeScript
* Socket.IO

### Database

* MongoDB
* Mongoose

### Development

* npm Workspaces
* Git & GitHub

---

## 📁 Project Structure

```text
VibeRoom/
│
├── apps/
│   ├── web/                  # React + TypeScript frontend
│   │
│   └── server/               # Node.js + Express + Socket.IO backend
│
├── packages/                 # Shared packages (planned)
│
├── .gitignore
├── package.json
└── package-lock.json
```

### `apps/web`

Contains the VibeRoom frontend.

This is where the user interface, chat interface, YouTube interface, authentication pages and admin interface will live.

### `apps/server`

Contains the backend.

The backend will handle:

* REST APIs
* Authentication
* Authorization
* Socket.IO connections
* Real-time messaging
* MongoDB communication
* Admin operations

### `packages`

Reserved for shared code between the frontend and backend, such as TypeScript types and utilities.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/codeid9/viberoom.git
cd VibeRoom
```

### 2. Install dependencies

From the project root:

```bash
npm install
```

### 3. Start the development server

Backend:

```bash
npm run dev -w @viberoom/server
```

The backend will run on:

```text
http://localhost:5000
```

Frontend development will be available from the Vite development server.

---

## 🔐 Environment Variables

Environment variables are used for secrets and configuration.

Create an `.env` file inside the server directory:

```text
apps/server/.env
```

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
```

> ⚠️ Never commit `.env` files or secret keys to GitHub.

For contributors, use:

```text
apps/server/.env.example
```

as a reference.

---

## 🔄 Architecture

VibeRoom follows a client-server architecture:

```text
                    ┌──────────────────┐
                    │   React Client   │
                    │  apps/web        │
                    └────────┬─────────┘
                             │
                    HTTP / Socket.IO
                             │
                             ▼
                    ┌──────────────────┐
                    │  Node.js Server  │
                    │  apps/server     │
                    └────────┬─────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
              Socket.IO            MongoDB
            Real-time Chat        Persistent Data
```

The frontend does **not** connect directly to MongoDB.

All database operations go through the backend.

---

## 🧑‍💻 Contributing

Contributions are welcome!

If you find a bug, have an improvement, or want to add a feature, feel free to contribute.

### 1. Fork the repository

Create your own fork of VibeRoom.

### 2. Clone your fork

```bash
git clone https://github.com/codeid9/viberoom.git
cd VibeRoom
```

### 3. Create a branch

Use a descriptive branch name:

```bash
git checkout -b feature/your-feature
```

Examples:

```text
feature/chat-reactions
feature/user-profile
fix/socket-connection
fix/mobile-layout
```

### 4. Make your changes

Follow the existing project structure and keep changes focused.

### 5. Test your changes

Make sure the application builds and works correctly before submitting a pull request.

```bash
npm run build
```

### 6. Commit your changes

Use a clear commit message:

```bash
git add .
git commit -m "feat: add chat reactions"
```

### 7. Push your branch

```bash
git push origin feature/your-feature
```

### 8. Open a Pull Request

Create a Pull Request against the `main` branch and explain:

* What you changed
* Why you changed it
* How you tested it
* Any known limitations

---

## 🐛 Reporting Issues

Found a bug?

Please open an issue and include:

* A clear description of the problem
* Steps to reproduce it
* Expected behavior
* Actual behavior
* Browser/OS information if relevant
* Screenshots or error logs when useful

For security vulnerabilities, **do not publicly disclose sensitive details in an issue**. Contact the project maintainer privately instead.

---

## 📌 Development Status

VibeRoom is currently in the early development stage.

### Current

* [x] Monorepo setup
* [x] React + TypeScript frontend
* [x] Node.js + Express backend
* [x] TypeScript backend configuration
* [ ] Socket.IO integration
* [ ] MongoDB integration
* [ ] Authentication
* [ ] Real-time chat
* [ ] YouTube integration
* [ ] Admin panel
* [ ] Production deployment

---

## 📜 License

This project is currently under development. License details will be added as the project progresses.

---

## ⭐ Support

If you find VibeRoom interesting, consider giving the repository a ⭐ on GitHub.

Contributions, bug reports and feature ideas are welcome.

---

**Built with ❤️ using React, TypeScript, Node.js, Socket.IO and MongoDB.**
