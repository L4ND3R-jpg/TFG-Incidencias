# 📡 Sistema de Gestión de Incidencias Telecom (TFG)

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-JWT-green.svg?style=flat&logo=springsecurity)](https://spring.io/projects/spring-security)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg?style=flat&logo=mysql)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

Plataforma integral web para la gestión, despacho y resolución de incidencias técnicas en redes de telecomunicaciones (Fibra Óptica y Averías generales). Desarrollada como **Trabajo Fin de Grado (TFG)**, integra un backend robusto basado en **Spring Boot 3**, persistencia en **MySQL 8** con JPA/Hibernate, seguridad con **JWT**, y un frontend reactivo e interactivo en **React 19** con **Tailwind CSS**.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura y Estructura](#-arquitectura-y-estructura)
- [Requisitos Previos](#-requisitos-previos)
- [Puesta en Marcha](#-puesta-en-marcha)
  - [1. Base de Datos (MySQL)](#1-base-de-datos-mysql)
  - [2. Backend (Spring Boot)](#2-backend-spring-boot)
  - [3. Frontend (React + Vite)](#3-frontend-react--vite)
- [Roles y Cuentas de Demostración](#-roles-y-cuentas-de-demostración)
- [Flujo de Estados de una Incidencia](#-flujo-de-estados-de-una-incidencia)
- [Documentación de la API REST](#-documentación-de-la-api-rest)
- [Guión de Pruebas E2E (Demostración)](#-guión-de-pruebas-e2e-demostración)

---

## 🚀 Características Principales

1. **Gestión de Roles y Seguridad**:
   - Autenticación Stateless basada en **JSON Web Tokens (JWT)**.
   - Perfiles diferenciados con permisos específicos: `GESTOR`, `TECNICO` y `CLIENTE`.

2. **Asignación Inteligente por Rotación Semanal**:
   - Sistema de turnos por semana ISO que alterna a los técnicos entre especialidades (**Averías** y **Fibra**).
   - Asignación automática de incidencias según la semana de la cita y la carga de trabajo.

3. **Citas y Huecos Libres**:
   - Averías por franjas horarias (**MAÑANA** / **TARDE**).
   - Altas de Fibra con cálculo de slots disponibles (cada 30 min entre 09:00-14:00 y 16:00-20:00) y duración estimada sin solapes.

4. **Flujo de Atención en Campo y Stand-By**:
   - Los técnicos gestionan su agenda diaria, pasan incidencias a `EN_CURSO` y cuentan con un botón de **"Avisar Cliente"** con temporizador regresivo de enfriamiento (cooldown de 5 minutos).
   - En caso de cliente ausente, paso a `STAND_BY` con aviso automático al gestor y posibilidad de reprogramación interactiva por parte del cliente.

5. **Partes de Trabajo y Facturación de Extras**:
   - Registro de tiempos reales trabajados (`horaInicioReal`, `horaFinReal`).
   - Detalle de materiales y conceptos extra cobrables con validaciones de importe y descripción técnica.

6. **Sistema de Notificaciones Web**:
   - Centro de notificaciones integrado con campana interactiva, contador de no leídas y filtrado dinámico.

---

## 📂 Arquitectura y Estructura

```text
tfg-incidencias/
├── backend/                       # API REST con Spring Boot 3
│   ├── .mvn/wrapper/              # Maven Wrapper
│   ├── src/main/java/.../         # Código fuente Java
│   │   ├── config/                # Seguridad, CORS y DataInitializer
│   │   ├── controller/            # Controladores REST (/api/...)
│   │   ├── dto/                   # Data Transfer Objects y validaciones
│   │   ├── entity/                # Entidades JPA (Usuario, Incidencia, etc.)
│   │   ├── exception/             # Manejador global de excepciones
│   │   ├── repository/            # Repositorios Spring Data JPA
│   │   ├── security/              # Filtros JWT y servicio UserDetails
│   │   └── service/               # Lógica de negocio y asignaciones
│   ├── src/main/resources/
│   │   └── application.properties # Parámetros de conexión DB y JWT
│   ├── mvnw / mvnw.cmd            # Ejecutable wrapper de Maven
│   └── pom.xml                    # Dependencias Maven
│
├── frontend/                      # Aplicación SPA con React 19 + Vite
│   ├── src/
│   │   ├── assets/                # Recursos estáticos e imágenes
│   │   ├── components/            # Componentes reutilizables y layout
│   │   ├── context/               # Contextos globales (AuthContext, ToastContext)
│   │   ├── pages/                 # Vistas (Login, Register, Dashboards por rol)
│   │   ├── services/              # Cliente HTTP Axios y llamadas API
│   │   ├── App.jsx                # Enrutador principal y rutas protegidas
│   │   └── main.jsx               # Punto de entrada
│   ├── package.json               # Dependencias npm y scripts
│   └── vite.config.js             # Configuración del bundler Vite
│
├── start-mysql.bat                # Script de ayuda para arranque local de MySQL
├── .gitignore                     # Exclusiones de Git (node_modules, target, etc.)
└── README.md                      # Documentación completa del proyecto
```

---

## 🛠️ Requisitos Previos

- **Java Development Kit (JDK)**: Versión **21** o superior.
- **Node.js**: Versión **18.x** o superior (con npm).
- **MySQL Server**: Versión **8.0** o superior.
- **Git**: Para el control de versiones.

---

## ⚡ Puesta en Marcha

### 1. Base de Datos (MySQL)

1. Inicia tu servidor MySQL 8 (puedes apoyarte en `start-mysql.bat` o en el servicio de Windows/Linux).
2. Crea la base de datos `tfg_incidencias`:
   ```sql
   CREATE DATABASE IF NOT EXISTS tfg_incidencias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Verifica las credenciales en `backend/src/main/resources/application.properties` (por defecto `root` sin contraseña en `localhost:3306`).
   *Nota: Hibernate creará y actualizará automáticamente las tablas gracias a `spring.jpa.hibernate.ddl-auto=update`.*

### 2. Backend (Spring Boot)

1. Abre un terminal en la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Ejecuta el servidor mediante el Maven Wrapper:
   - **En Windows**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - **En Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```
3. La API arrancará en: `http://localhost:8080/api`
4. Al iniciar, `DataInitializer` creará automáticamente los usuarios corporativos y turnos semanales base.

### 3. Frontend (React + Vite)

1. Abre un segundo terminal en la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la URL indicada por Vite (normalmente `http://localhost:5173`).

---

## 👥 Roles y Cuentas de Demostración

El sistema precarga las siguientes cuentas predeterminadas al arrancar:

| Rol | Correo Electrónico | Contraseña | Descripción / Responsabilidades |
| :--- | :--- | :--- | :--- |
| **GESTOR** | `gestor@telecom.es` | `gestor123` | Supervisión global, rotación semanal de técnicos, alta de personal y consulta de partes. |
| **TÉCNICO** | `tecnico1@telecom.es` | `tecnico123` | Técnico asignado inicialmente a **Averías**. Gestión de agenda, avisos y partes. |
| **TÉCNICO** | `tecnico2@telecom.es` | `tecnico123` | Técnico asignado inicialmente a **Fibra**. Instalaciones y franjas horarias. |
| **CLIENTE** | `cliente@test.es` | `cliente123` | Cliente particular. Alta de incidencias, notificaciones y reprogramación. |

*(Los clientes también pueden registrarse de forma pública desde el formulario de registro).*

---

## 🔄 Flujo de Estados de una Incidencia

```
[ PENDIENTE ]
      │
      ▼
[ ASIGNADA ] ──(Técnico inicia trabajo)──► [ EN_CURSO ]
      ▲                                         │
      │                                    ┌────┴──────────────────────────┐
      │ (Cliente reprograma)               ▼ (Cliente ausente)             ▼ (Finalizado)
      └───────────────────────────── [ STAND_BY ]                  [ RESUELTA ]
                                                                   (Con Parte de Trabajo)
```

---

## 📖 Documentación de la API REST

Base URL: `http://localhost:8080/api`

### 1. Autenticación (`/auth`)

#### Registrar Cliente
- **Método**: `POST` | **Ruta**: `/auth/register` | **Rol**: Público
- **Cuerpo**:
```json
{
  "nombre": "Pedro Martínez",
  "email": "cliente@test.es",
  "password": "cliente123",
  "telefono": "611222333"
}
```

#### Iniciar Sesión
- **Método**: `POST` | **Ruta**: `/auth/login` | **Rol**: Público
- **Cuerpo**:
```json
{
  "email": "gestor@telecom.es",
  "password": "gestor123"
}
```
- **Respuesta**: Token Bearer JWT e información del usuario autenticado.

---

### 2. Asignaciones Semanales (`/asignaciones-semanales`)

#### Consultar Asignaciones Semanales
- **Método**: `GET` | **Ruta**: `/asignaciones-semanales?anio=2026&semana=42` | **Rol**: `GESTOR`

#### Configurar Asignación Semanal
- **Método**: `POST` | **Ruta**: `/asignaciones-semanales` | **Rol**: `GESTOR`
- **Cuerpo**:
```json
{
  "tecnicoId": 2,
  "anio": 2026,
  "semana": 42,
  "tipoAsignado": "AVERIAS"
}
```

#### Listar Técnicos Activos
- **Método**: `GET` | **Ruta**: `/asignaciones-semanales/tecnicos` | **Rol**: `GESTOR`

---

### 3. Incidencias (`/incidencias`)

#### Crear Incidencia (Avería)
- **Método**: `POST` | **Ruta**: `/incidencias` | **Rol**: `CLIENTE`
- **Cuerpo**:
```json
{
  "tipo": "AVERIA",
  "direccion": "Calle Mayor 14, 2B, Madrid",
  "telefonoContacto": "611222333",
  "descripcion": "Sin señal de internet en el router",
  "fechaCita": "2026-10-16",
  "franja": "MANANA"
}
```

#### Crear Incidencia (Fibra)
- **Método**: `POST` | **Ruta**: `/incidencias` | **Rol**: `CLIENTE`
- **Cuerpo**:
```json
{
  "tipo": "FIBRA",
  "direccion": "Avenida América 45, Bajo D, Madrid",
  "telefonoContacto": "611222333",
  "descripcion": "Instalación de fibra óptica 600Mb",
  "fechaCita": "2026-10-16",
  "horaInicioEstimada": "10:30:00",
  "duracionEstimadaMinutos": 90
}
```

#### Listar Incidencias
- **Método**: `GET` | **Ruta**: `/incidencias`
- **Rol**: `CLIENTE` (sus incidencias), `TECNICO` (asignadas), `GESTOR` (todas).

#### Detalle de Incidencia
- **Método**: `GET` | **Ruta**: `/incidencias/{id}` | **Rol**: Involucrados o `GESTOR`

#### Agenda Diaria del Técnico
- **Método**: `GET` | **Ruta**: `/incidencias/tecnico/agenda-diaria?fecha=2026-10-16` | **Rol**: `TECNICO`

#### Reasignar Técnico
- **Método**: `PATCH` | **Ruta**: `/incidencias/{id}/reasignar` | **Rol**: `GESTOR`
- **Cuerpo**: `{ "tecnicoId": 3 }`

#### Cambiar Estado
- **Método**: `PATCH` | **Ruta**: `/incidencias/{id}/estado` | **Rol**: `GESTOR`, `TECNICO`
- **Cuerpo**: `{ "nuevoEstado": "STAND_BY" }`

#### Avisar Cliente (Cooldown de 5 minutos)
- **Método**: `POST` | **Ruta**: `/incidencias/{id}/avisar-cliente` | **Rol**: `TECNICO` asignado

#### Registrar Parte de Trabajo y Finalizar Incidencia
- **Método**: `POST` | **Ruta**: `/incidencias/{id}/parte` | **Rol**: `TECNICO` asignado
- **Cuerpo**:
```json
{
  "fecha": "2026-10-16",
  "horaInicioReal": "10:30:00",
  "horaFinReal": "11:45:00",
  "descripcionRealizado": "Sustitución de roseta óptica y conectorización directa.",
  "extras": [
    {
      "concepto": "Cable UTP Cat 6 adicional (10m)",
      "importe": 15.50
    }
  ]
}
```

#### Consultar Huecos Libres de Fibra
- **Método**: `GET` | **Ruta**: `/incidencias/{id}/huecos-libres?fecha=2026-10-20` | **Rol**: `CLIENTE` (dueño, en STAND_BY)

#### Reprogramar Incidencia
- **Método**: `PATCH` | **Ruta**: `/incidencias/{id}/reprogramar` | **Rol**: `CLIENTE` (en STAND_BY)
- **Cuerpo (Avería)**: `{ "fechaCita": "2026-10-20", "franja": "TARDE" }`
- **Cuerpo (Fibra)**: `{ "fechaCita": "2026-10-20", "horaInicioEstimada": "11:00:00" }`

---

### 4. Partes de Trabajo (`/partes`)

#### Listar Partes de Trabajo
- **Método**: `GET` | **Ruta**: `/partes` | **Rol**: `GESTOR` (todos), `TECNICO` (propios).

---

### 5. Notificaciones (`/notificaciones`)

- `GET /notificaciones`: Listar notificaciones del usuario (filtro `?soloNoLeidas=true`).
- `GET /notificaciones/no-leidas/count`: Total de alertas sin leer.
- `PATCH /notificaciones/{id}/leida`: Marcar notificación concreta como leída.
- `PATCH /notificaciones/leer-todas`: Marcar todas como leídas.

---

### 6. Gestión de Usuarios (`/usuarios`)

#### Dar de Alta Técnico de Campo
- **Método**: `POST` | **Ruta**: `/usuarios/tecnicos` | **Rol**: `GESTOR`
- **Cuerpo**:
```json
{
  "nombre": "Carlos Martínez",
  "email": "carlos.tecnico@telecom.es",
  "telefono": "622334455",
  "password": "password123"
}
```

---

## 🧪 Guión de Pruebas E2E (Demostración)

1. **Creación de Incidencia (Cliente)**:
   - Inicia sesión como `cliente@test.es` (o utiliza los botones de acceso rápido).
   - Haz clic en **"+ Nueva Incidencia"**.
   - Selecciona **Avería**, indica dirección, teléfono y franja **Mañana**.
   - Al pulsar **"Crear Incidencia"**, se asignará automáticamente al técnico de averías según el cuadrante semanal.

2. **Atención y Aviso en Campo (Técnico)**:
   - Inicia sesión como `tecnico1@telecom.es`.
   - Localiza la incidencia asignada en la agenda del día.
   - Pulsa **"▶️ Empezar"** para pasarla a `EN_CURSO`.
   - Pulsa **"🔔 Avisar Cliente"**: se activará una cuenta atrás de 5 minutos y se enviará una notificación web al cliente.
   - Si no hay respuesta, pulsa **"⏸️ Stand By (Sin respuesta)"**: la incidencia pasa a `STAND_BY` y se avisa al gestor para optimizar tiempos.

3. **Reprogramación Interactiva (Cliente)**:
   - Inicia sesión como `cliente@test.es`.
   - Consulta la campana 🔔 con el indicador de no leídas.
   - En la tarjeta en `STAND_BY`, pulsa **"⚠️ Reprogramar Cita"** y selecciona una nueva fecha. La incidencia volverá a `ASIGNADA`.

4. **Cierre con Parte de Trabajo (Técnico)**:
   - El técnico reanuda la incidencia con **"▶️ Empezar"** y pulsa **"✅ Cerrar con Parte"**.
   - Indica horas reales y añade extras con importe (ej: cable o conectores).
   - Al guardar, la incidencia pasa a `RESUELTA`.

5. **Supervisión y Control (Gestor)**:
   - Inicia sesión como `gestor@telecom.es`.
   - Supervisa métricas en las tarjetas de estadísticas, consulta el parte recién emitido con sus importes desglosados y gestiona turnos o nuevas contrataciones.

---

## 📄 Licencia

Proyecto desarrollado con fines académicos en el marco del Trabajo Fin de Grado (TFG). Todos los derechos reservados.
