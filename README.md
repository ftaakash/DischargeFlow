<div align="center">
  <img src="https://img.icons8.com/color/96/000000/hospital-2.png" alt="DischargeFlow Logo" />
  <h1>🏥 DischargeFlow</h1>
  <p><strong>A Modern, AI-Powered Hospital Discharge Management System</strong></p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  </p>
</div>

<br />

## ✨ Features

- **📊 Command Center Dashboard:** Real-time visibility into discharge metrics, system wait times, and active KPI trends visually tracked via Recharts.
- **🧑‍⚕️ Role-Based Access Control:** Secure isolation between Administrators, Nurses, and Physicians seamlessly tied with Google OAuth authentication.
- **📈 Patient Census Tracking:** See live patient counts, track detailed room assignments, and monitor real-time admission/pending statuses.
- **⚡ AI-Powered Discharge Summaries:** Utilizes a custom LLM pipeline to automatically generate precise, HIPAA-aware discharge paperwork for departing patients.
- **📋 Smart Workflow Task Management:** 3-state checkbox system seamlessly manages collaborative steps required to get a patient out the door securely.

## 🚀 Getting Started

### 1. Requirements
- Node.js (v18+)
- Python (v3.10+) 
- _Note: This project can run locally with an in-memory MongoDB mock via `mongomock_motor` without a dedicated database server!_

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
_The frontend will be exposed at `http://localhost:3000`._

### 3. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn server:app --port 8000
```
_The backend API will be exposed at `http://localhost:8000`._

## 📐 Architecture
DischargeFlow enforces a decoupled frontend mapping directly to a robust, synchronous Python backend using RESTful standards. Designed exclusively using dynamic utility tokens within **Tailwind**, it ensures strict adherence to modern aesthetics.

<br />
<div align="center">
  <sub>Built with ❤️ by <strong>ftaakash</strong></sub>
</div>
