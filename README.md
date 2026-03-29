PROJEYI ÇALISTIRMA DETAYLARI EN AŞAGIDADIRR!!

ai-podcast-platform/
│
├── backend/        # .NET API
├── ai-service/     # Python FastAPI (AI + TTS)
├── mobile/         # React Native App
│
├── docker-compose.yml
├── README.md
└── .env

1️⃣ Monorepo Kurulumu
📌 1. Ana klasörü oluştur
mkdir ai-podcast-platform
cd ai-podcast-platform
git init

2️⃣ Backend (.NET) Kurulumu
📌 2. .NET Web API oluştur
cd backend
dotnet new webapi -n PodcastAPI
cd PodcastAPI

📌 3. Gerekli paketler
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package StackExchange.Redis

📌 4. Katmanlı yapı (çok önemli)
backend/
 └── PodcastAPI/
     ├── Controllers/
     ├── Services/
     ├── Models/
     ├── DTOs/
     ├── Data/
     └── Helpers/

📌 5. Çalıştır
dotnet run
API: https://localhost:5001

3️⃣ AI Service (Python / FastAPI)
📌 1. Klasör oluştur
cd ../../
mkdir ai-service
cd ai-service

📌 2. Virtual environment
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

📌 3. Paketler
pip install fastapi uvicorn requests python-dotenv

👉 Sonra AI için (SONRAYAPILCAK):

pip install openai
pip install gtts   # veya elevenlabs SDK
📌 4. Basit FastAPI başlat
main.py:
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI Service running"}

📌 5. Çalıştır
uvicorn main:app --reload --port 8000

➡️ API: http://localhost:8000

4️⃣ Mobile (React Native) Kurulumu
📌 1. Klasör
cd ../../
npx create-expo-app mobile
cd mobile

📌 2. Gerekli paketler
npm install axios
npm install @react-navigation/native
npm install expo-av

📌 3. Çalıştır
npx expo start

----------------------------(AKIŞTAYAPILACAK)-----------------------------
5️⃣ Servislerin Birbirine Bağlanması 
📡 .NET → Python

.NET içinde:

var client = new HttpClient();
var response = await client.GetAsync("http://localhost:8000/generate");
📡 React Native → .NET
import axios from "axios";

const API = "http://localhost:5000";

const getPodcast = async () => {
  const res = await axios.get(`${API}/podcast/today`);
  return res.data;
};

6️⃣ Docker ile Profesyonel Setup (ÖNEMLİ)

Bu projeyi uçuracak kısım burası 🚀

📦 docker-compose.yml
version: '3.8'

services:

  backend:
    build: ./backend/PodcastAPI
    ports:
      - "5000:80"
    depends_on:
      - ai-service

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"

  redis:
    image: redis
    ports:
      - "6379:6379"


📦 Python Dockerfile
FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install fastapi uvicorn

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


📦 .NET Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY . .
ENTRYPOINT ["dotnet", "PodcastAPI.dll"]

📌 Çalıştır
docker-compose up --build

7️⃣ Ortak ENV Yönetimi

Root .env:

OPENAI_API_KEY=xxx
FIREBASE_URL=xxx
REDIS_URL=redis:6379

--------------------------------------------------------------------------
🎯 Sonuç (Jüriye söylemelik)

Bu setup sayesinde şunu diyebilirsin:

Mikroservis mimarisi kullandım
AI servis ayrı ölçeklenebilir
Backend orchestration yapıyor
Mobile client bağımsuz
Docker ile production-ready hale getirdim


------------ PROJEYİ ÇALIŞTIRMA ----------------------
👉 3 ayrı terminal / sekme açarsın

🟢 Terminal 1 → AI Service (Python)
cd ai-service
source venv/bin/activate
uvicorn main:app --reload --port 8000

🔵 Terminal 2 → Backend (.NET)
cd backend/PodcastAPI
dotnet run

🟣 Terminal 3 → Mobile (React Native)
cd mobile
npx expo start

-------------------------------------------------------

PYTHON KISMINDA TERMINALDE:
Aktifleştir
source venv/bin/activate

Başarılı olursa terminal şöyle değişir:

(venv) admin@...

Buradan çıkmak için terminale; deactivate

🧠 Ne zaman açık kalmalı?
✅ Açık bırak:
Python servisinde çalışırken
pip install yaparken
FastAPI çalıştırırken
❌ Kapat:
.NET tarafına geçerken
React Native çalıştırırken