# 🇩🇪 Dashka German Translator — Production v1.0.0

DE-only production wrapper for Dashka Chat API.

## 🌐 Live URLs

Frontend (Static Site)
https://dashka-chat.onrender.com

Backend (Web Service)
https://api-dashka-chat.onrender.com

---

## 🏗 Architecture

Browser  
↓  
Static Site (web/)  
↓  
REST API (backend/)  
↓  
OpenAI

---

## 📦 Project Structure

backend/ → Node.js API (Render Web Service)  
web/ → Vite + React DE-only wrapper (Render Static Site)

---

## 🎯 Product Scope (v1.0.0)

- German-only target language
- Auto-detect source language
- Text translation
- Voice translation
- No WebSocket
- Unified state model (Web / iOS / Android)

---

## 🚀 Deployment (Render)

### Static Site
Root: web  
Build: npm install && npm run build  
Publish: dist  

### Web Service
Root: backend  
Start: node src/server.js