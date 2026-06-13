# Smart Inspect 🏭 AI-Powered Industrial Quality Control Platform

**Smart Inspect** is an advanced, end-to-end industrial software solution designed to automate and digitize quality control processes. Combining the power of **Computer Vision (Artificial Intelligence)** with a highly secure multi-tier architecture, the platform detects manufacturing anomalies in real time, automates mission planning for inspectors, and ensures critical data safety through biometrics.

---

## 🚀 Key Features

### 🧠 1. AI-Powered Anomaly Detection & Monitoring
* **Automated Visual Inspection:** Leverages supervised deep learning models to identify, classify, and localize physical defects in industrial components.
* **Real-Time Alerts:** Employs **WebSockets** to establish low-latency, bi-directional communication channels, instantly broadcasting critical defect notifications from the edge to the central supervision dashboard.

### 🔒 2. High-Grade Security & Biometrics
* **Double Authentication (2FA):** Secures sensitive industrial management spaces by combining standard credential verification with a mandatory **Facial Recognition** gate.
* **Biometric Identity Verification:** Powered by robust Python-based facial embedding matching pipelines to prevent unauthorized access to administrative controls and logs.

### 📋 3. Operations Management & Analytics
* **Mission Scheduling & Tracking:** Automated lifecycle management for component inspection tasks allocated to field technicians.
* **Operational KPIs & Dashboards:** Aggregates telemetry data into interactive charts providing actionable insights into manufacturing yield, inspector efficiency, and defect distribution statistics.

---

## 🛠️ Technology Stack

The platform is engineered using a decoupled, high-performance microservices-oriented layout:

* **Frontend (User Interface):** Built with **React.js**, styled via **Tailwind CSS**, and bundled with **Vite** for optimized component rendering, real-time chart synchronization, and reactive state management.
* **Backend API (Business Logic):** A robust **Spring Boot (Java)** REST API managing data persistence, business workflows, scheduling services, secure endpoint routing, and WebSocket server instances.
* **AI & Computer Vision Core:** A specialized **Python Service** handling heavy image processing tasks, executing deep learning inference, and running the live facial verification engine.
* **Database Management:** **MySQL** database cluster ensuring transactional integrity and structured relational mapping for history tracking, user profiles, and logs.

---

## 📝 Project Deliverables & Academic Recognition
This project was developed as a Graduation Project (**Projet de Fin d'Études - PFE**) for the completion of a *Bachelor's Degree (Licence) in Business Computing & Data Science* at the **Higher Institute of Commerce of Sfax (ESC Sfax)**.

* **Defense Date:** June 10, 2026
* **Academic Distinction:** **Highest Honors (Mention Très Bien)**
* **Project Author:** Ahmed Khlifi
* **Academic Advisor:** Mr. Atef Remili
* **Professional Mentor:** Ms. Yesmine Tounsi
