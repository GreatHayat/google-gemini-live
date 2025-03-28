# 🌟 Real-Time Gemini Live API Chat Application

This repository contains a **FastAPI backend** and a **ReactJS frontend** that enables **real-time chat** with Gemini AI, supporting both **text-based** and **text-to-audio** interactions.

## 🚀 Features

✅ **Real-time Text Chat (`/`)** – Chat with Gemini AI via text.  
✅ **Real-time Text-to-Audio Chat (`/audio-chat`)** – Receive AI-generated audio responses.  
✅ **Streaming Audio Chunks** – Immediate audio playback as chunks arrive.  
✅ **FastAPI Backend** – Handles WebSocket communication and integrates with Gemini API.  
✅ **ReactJS Frontend** – A user-friendly interface for seamless AI interaction.  

---

## 📌 Prerequisites

- **Python 3.7+**
- **Node.js & npm (for React)**
- **A valid Gemini API Key**

---

## 🛠 Setup Instructions

### 🔹 Backend (FastAPI)

1️⃣ **Clone the repository**  
```bash
git clone <repository_url>
cd <repository_directory>/backend
```

2️⃣ **Create and activate a virtual environment**  
```bash
python3 -m venv venv  
source venv/bin/activate  # macOS/Linux  
venv\Scripts\activate  # Windows  
```

3️⃣ **Install dependencies**  
```bash
pip install -r requirements.txt
```

4️⃣ **Set the Gemini API Key**  
```bash
export GEMINI_API_KEY="your_api_key"  # macOS/Linux  
set GEMINI_API_KEY="your_api_key"  # Windows  
```

5️⃣ **Run the FastAPI server**  
```bash
uvicorn main:app --reload --port 5001
```
📍 Backend will be available at **http://127.0.0.1:5001**.

---

### 🔹 Frontend (ReactJS)

1️⃣ **Navigate to the frontend directory**  
```bash
cd ../frontend
```

2️⃣ **Install dependencies**  
```bash
npm install
```

3️⃣ **Run the React application**  
```bash
npm run dev
```
📍 Frontend will be available at **http://localhost:5173**.

---

## 🎯 How to Use

### **1️⃣ Start the backend & frontend**
Make sure both are running before testing.

### **2️⃣ Open the app in your browser**
Visit `http://localhost:5173`.

### **3️⃣ Choose a chat mode**
- **Text Chat (`/`)** – Type a message and send it.
- **Audio Chat (`/audio-chat`)** – Enter a message and receive AI-generated speech.

---

## 🔑 Environment Variables

- **`GEMINI_API_KEY`** – Required to access the Gemini API.

---

## ⚠️ Important Notes

- Ensure your Gemini API key is **active** and has the correct **permissions**.
- Adjust WebSocket URLs in the React app if running the backend on a different host/port.
- Audio streaming relies on **AudioContext API** (ensure browser compatibility).
- In production, consider implementing **security & authentication**.

---

## 💡 Contributing

Want to improve this project? **Pull requests are welcome!** 🚀  
For issues or suggestions, feel free to open a discussion.
