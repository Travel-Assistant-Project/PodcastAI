# 🎙️ PodcastAI

**An AI-powered mobile application for creating and experiencing personalized podcasts.**

PodcastAI is a mobile application project that brings together mobile development, backend services, and AI-powered capabilities in a modular architecture. The project is designed to provide a foundation for generating AI-assisted podcast experiences through an integrated application and service ecosystem.

## ✨ Overview

PodcastAI consists of three main components:

- **Mobile Application:** A cross-platform mobile interface built with React Native and Expo.
- **Backend API:** A .NET-based backend responsible for application-level operations and communication between services.
- **AI Service:** A Python-based service built with FastAPI, designed to support AI-related functionality and text-to-speech integrations.

The modular structure separates mobile, backend, and AI responsibilities, making the application easier to develop, maintain, and extend.

## 🏗️ Architecture

```text
PodcastAI/
├── ai-service/    # Python / FastAPI AI service
├── backend/       # .NET backend API
├── mobile/        # React Native / Expo application
├── .gitignore
├── README.md
└── ai-podcast-platform.sln
```

### Technology Stack

| Component | Technologies |
|---|---|
| Mobile | React Native, Expo, TypeScript |
| Backend | C#, .NET Web API |
| AI Service | Python, FastAPI, Uvicorn |
| API Communication | HTTP / REST |
| Development Tools | Git, GitHub, npm, pip |

## 🚀 Getting Started

### Prerequisites

Make sure the following tools are installed:

- [Node.js and npm](https://nodejs.org/)
- [Python 3](https://www.python.org/)
- [Git](https://git-scm.com/)
- [.NET SDK](https://dotnet.microsoft.com/download)
- [Expo Go](https://expo.dev/go/) or an appropriate mobile simulator

### 1. Clone the Repository

```bash
git clone https://github.com/Travel-Assistant-Project/PodcastAI.git
cd PodcastAI
```

### 2. Set Up the AI Service

Navigate to the AI service directory:

```bash
cd ai-service
python3 -m venv venv
```

Activate the virtual environment.

**macOS / Linux**

```bash
source venv/bin/activate
```

**Windows**

```powershell
venv\Scripts\activate
```

Install the project's Python dependencies using the available dependency file. If the repository contains `requirements.txt`, run:

```bash
pip install -r requirements.txt
```

Start the FastAPI service:

```bash
uvicorn main:app --reload --port 8000
```

If the application entry point is located elsewhere, adjust the Uvicorn module path accordingly.

The service should be available at:

- API: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`

### 3. Set Up the Backend

Open a separate terminal and navigate to the backend project directory.

```bash
cd backend
```

Locate the directory containing the `.csproj` file, then restore dependencies and run the application:

```bash
dotnet restore
dotnet run
```

The backend URL and port are determined by the project's launch settings.

### 4. Set Up the Mobile Application

Open another terminal:

```bash
cd mobile
npm install
```

Configure the backend API URL in the mobile application's environment configuration.

For example, when running the app in the iOS Simulator:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5191
```

Replace the example port with the actual backend port. Android emulators and physical devices may require a different host address.

Start the Expo development server:

```bash
npx expo start
```

Follow the terminal instructions to open the application in a simulator or Expo Go.

## 🔧 Configuration

Configure environment variables separately for each service as required by its implementation.

Example mobile configuration:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5191
```

Keep API keys, database credentials, and other secrets in environment files or a secure configuration system. Do not commit sensitive values to version control.

### Security configuration

The repository includes safe templates for local configuration:

```bash
cp backend/PodcastAPI/.env.example backend/PodcastAPI/.env
cp ai-service/.env.example ai-service/.env
```

Replace every `replace-with-...` value with a newly generated secret before
starting the services. `JWT_SECRET` and `AI_SERVICE_SECRET` must contain at
least 32 characters, and the backend and AI service must use the same
`AI_SERVICE_SECRET`. Real `.env` files and Firebase service-account JSON files
are ignored by Git.

If a real credential was ever committed, removing it from the current file is
not sufficient: revoke or rotate it at the provider first. Coordinate any Git
history rewrite with every collaborator because it changes commit hashes.

## 🧩 Development Workflow

For local development, run each component in a separate terminal:

| Terminal | Component | Command |
|---|---|---|
| 1 | AI Service | `uvicorn main:app --reload --port 8000` |
| 2 | Backend | `dotnet run` |
| 3 | Mobile | `npx expo start` |

Ensure that the mobile application points to the correct backend address and that the backend can reach the AI service when required.

## 🛠️ Troubleshooting

**Python dependencies cannot be installed**

Activate the virtual environment and verify that the dependency file exists in the current directory.

**The mobile application cannot connect to the backend**

Check the API base URL, the backend's running port, and network accessibility. Remember that `localhost` refers to the device or emulator itself when used from a mobile environment.

**The FastAPI service does not start**

Verify the Python entry-point file and ensure that the Uvicorn module path matches the actual project structure.

**The .NET application does not start**

Run `dotnet restore` in the directory containing the project file and check the configured SDK version.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes with a descriptive message.
4. Push your branch.
5. Open a pull request describing your changes.

## 📄 License

No license has been specified in this README. Please check the repository's licensing terms before distributing or reusing the project.

---

Developed as part of the **Travel Assistant Project**.
