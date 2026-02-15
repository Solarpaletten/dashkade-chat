# 🎤 DashkaVoicePL - Real-time Translation Platform

AI-powered voice translator with manual and auto-detect modes.

## Features
- 🎯 Manual translation mode (RU↔FR)
- 🤖 Auto language detection (10 languages)
- 🔊 Text-to-Speech (OpenAI TTS)
- 🎤 Speech recognition (Whisper)
- ⚡ Real-time WebSocket sync
- 📱 Responsive UI (Desktop/Tablet/Mobile)

## Tech Stack
**Backend:** Node.js, Express, WebSocket, OpenAI API
**Frontend:** React, TypeScript, Vite, Tailwind CSS

## Setup
\`\`\`bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
\`\`\`

See [API_REFERENCE.md](docs/API_REFERENCE.md) for details.

const leftPanelRef = useRef<HTMLTextAreaElement>(null);

git add backend/.env.production frontend/.env.production
git commit -m "feat: add production environment configs for Render"
git push origin main

delete cors

git commit -m "dashka-chat"