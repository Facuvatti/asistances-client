# 📘 School Attendance System

A web application for recording and viewing student attendance.  
It allows users to display attendance data **by class** or **by individual student**, with dynamic filters for **year, division, and specialty**.

## 🚀 Main Features
- Real-time attendance registration and updates  
- Dynamic visualization by class or student  
- Automatic filtering based on selected options  
- **Dark mode minimalist** interface  
- Built with **JavaScript, HTML, CSS, and Express**  
- Persistent storage using **MySQL**

## 🛠️ Technologies
- **Frontend:** HTML, CSS, JavaScript (modular)  
- **Backend:** Node.js with Express  
- **Database:** MySQL  
- **Architecture:** Client-server structure

## 💡 Goal
To simplify and modernize attendance tracking for educational institutions, offering a fast, user-friendly interface with a clean and minimal dark aesthetic.


## 🧑‍💻 Desarrollo local

1. Levantar la API y la base local desde `asistances-backend` (`docker compose up -d mysql` y `npm run dev`).
2. En este repo: `npm install` y `npm run dev` → http://localhost:5173/asistances-client/

La URL de la API se toma de `VITE_API_URL` (`.env.development` apunta a `http://localhost:3000`;
el build de producción usa `https://api.asistances.dpdns.org`). En producción la API necesita
`COOKIE_CROSS_SITE=true`, porque el cliente (GitHub Pages) y la API están en dominios distintos.

Inicio de sesión con usuario y contraseña (better-auth). Usuarios demo: `admin`, `preceptor`,
`profesor`, `alumno`, `padre` (contraseña `demo1234`). Cada rol ve solo sus pantallas; el admin
crea las cuentas desde *Usuarios*, de a una o importando un CSV.
