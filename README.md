# 🎉 VibeRoom

**VibeRoom** is a private social hangout platform built for friends to chat, watch YouTube content, and enjoy a shared online space together.

The project is built as a **full-stack TypeScript monorepo** with real-time communication using Socket.IO and persistent chat storage using MongoDB.

> 🚧 **VibeRoom is currently under active development / beta stage.**

---

## ✨ Features

### 🏠 Room System

- Create a unique room
- Join rooms using a shareable room URL
- Server-generated room IDs
- Backend validates room existence
- No login or registration required

### 👤 Display Names

- Users enter a display name when joining a room
- Minimum 3 characters
- Maximum 30 characters
- Display names are associated with the current Socket.IO connection
- No user account is required

### 💬 Real-Time Chat

- Real-time messaging using Socket.IO
- Messages are delivered to everyone in the same room
- Chat messages are stored in MongoDB
- Previous messages are loaded when joining a room
- Server-side message validation
- Empty and invalid messages are rejected

### 👥 Online Users

- Shows the real number of connected users in a room
- Online count updates when users join or leave
- Each browser tab is counted as a separate connection

### ▶️ YouTube

- Paste a YouTube URL to load a video
- Supports common YouTube URL formats
- YouTube video selection is shared with users in the same room
- Changing the selected video updates it for everyone in the room

### 📱 Responsive UI

- Dark-themed interface
- Responsive room layout
- Chat and YouTube player designed for different screen sizes

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO

### Database

- MongoDB
- Mongoose

### Development

- npm Workspaces
- Git
- GitHub

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
├── packages/                 # Shared packages
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md