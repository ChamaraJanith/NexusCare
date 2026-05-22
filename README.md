# NexusCare — Healthcare Microservices Platform

NexusCare is a full-stack telemedicine platform built on a microservices architecture. It connects patients with doctors for appointment booking, video consultations, AI-assisted symptom checking, and online payments — all managed through a single API gateway.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Running Services Individually](#running-services-individually)
- [Environment Variables](#environment-variables)
- [API Gateway Routes](#api-gateway-routes)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Testing](#testing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3 / Quasar)            │
│                         http://localhost:9000               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway  :8080                        │
│              (Express + http-proxy-middleware)               │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┘
   │      │      │      │      │      │      │      │
  :5001  :5002  :5003  :5004  :5005  :5006  :5007  :5009
   │      │      │      │      │      │      │      │
User  Doctor  Appt   AI   Video  Notif  Fee  Payment
Svc   Svc     Svc   Svc   Svc    Svc   Svc   Svc
   │      │      │      │      │      │      │      │
   └──────┴──────┴──────┴──────┴──────┴──────┴──────┘
                          │
              ┌───────────┴───────────┐
              │                       │
           MongoDB               RabbitMQ
          (Atlas)                  :5672
```

Services communicate asynchronously via **RabbitMQ** for event-driven workflows (appointment confirmations, notifications, doctor sync). Each service maintains its own MongoDB database (database-per-service pattern).

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | Single entry point, request routing, CORS, resilient fallbacks |
| `user-patient-service` | 5001 | Auth (JWT), patient profiles, admin user management |
| `doctor-service` | 5002 | Doctor profiles, availability slots, prescriptions, Cloudinary uploads |
| `appointment-service` | 5003 | Appointment booking, slot management, real-time updates via Socket.IO |
| `ai-symptom-service` | 5004 | AI-powered symptom analysis using Google Gemini |
| `video-session-integration-service` | 5005 | Jitsi video session management, doctor catalog sync |
| `notification-service` | 5006 | Email (Nodemailer/Gmail) and SMS (Twilio) notifications |
| `fee-management-service` | 5007 | Hospital and consultation fee management |
| `payment-service` | 5009 | PayHere payment gateway integration, appointment snapshots |

### Resilient Fallbacks

The API gateway implements graceful degradation:
- If `appointment-service` is down, doctor schedule reads fall back to `doctor-service` snapshots
- Patient appointment reads fall back to `payment-service` snapshots
- Availability reads fall back from `doctor-service` to `appointment-service`

---

## Tech Stack

**Frontend**
- Vue 3 + Quasar Framework v2 (Vite-based)
- Pinia (state management)
- Axios, Vue Router, Vue I18n
- jsPDF (prescription/report PDF generation)
- Three.js, GSAP (UI animations)

**Backend (all services)**
- Node.js 20 + Express
- MongoDB + Mongoose
- RabbitMQ (amqplib) — async event bus
- JWT authentication
- Joi / express-validator — request validation
- Helmet, CORS — security middleware

**Service-specific**
- `ai-symptom-service` — Google Generative AI (`@google/generative-ai`)
- `doctor-service` / `user-patient-service` — Cloudinary + Multer (file uploads)
- `notification-service` — Nodemailer, Twilio, Jest test suite
- `appointment-service` — Socket.IO (real-time slot updates)
- `video-session-integration-service` — Jitsi Meet integration

**Infrastructure**
- Docker + Docker Compose (local development)
- Kubernetes (production) — deployments, services, ConfigMap, Secrets, RBAC
- MongoDB Atlas (per-service databases)

---

## Project Structure

```
nexuscare/
├── docker-compose.yml
├── frontend/                          # Vue 3 / Quasar SPA
│   ├── src/
│   │   ├── pages/                     # Route-level components
│   │   │   ├── admin/                 # Admin dashboard pages
│   │   │   ├── appointment/           # Booking flow pages
│   │   │   └── doctor/                # Doctor dashboard pages
│   │   ├── stores/                    # Pinia stores (auth, appointment)
│   │   ├── services/                  # Axios API clients per domain
│   │   └── utils/                     # PDF generation utilities
│   └── Dockerfile
├── backend/
│   ├── api-gateway/                   # Reverse proxy + routing
│   ├── user-patient-service/          # MS1 — Auth & patients
│   ├── doctor-service/                # MS2 — Doctors & availability
│   ├── appointment-service/           # MS3 — Appointments & slots
│   ├── ai-symptom-service/            # AI symptom checker
│   ├── video-session-integration-service/  # MS4 — Video sessions
│   ├── notification-service/          # Email & SMS notifications
│   ├── fee-management-service/        # Hospital fees
│   └── payment-service/               # MS5 — Payments
└── k8s/                               # Kubernetes manifests
    ├── nexuscare-namespace.yaml
    ├── nexuscare-config.yaml          # ConfigMap + Secrets
    ├── nexuscare-deployments.yaml     # All service deployments
    ├── nexuscare-rbac.yaml
    └── nexuscare-resources.yaml
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 20+ (for running services individually)
- A `.env` file in each service directory (see [Environment Variables](#environment-variables))

### Running with Docker Compose

This is the recommended way to run the full stack locally.

```bash
# Clone the repository
git clone <repo-url>
cd nexuscare

# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down
```

Once running:
- Frontend: http://localhost:9000
- API Gateway: http://localhost:8080
- RabbitMQ Management UI: http://localhost:15672 (guest / guest)
- MongoDB: localhost:27017

### Running Services Individually

Each service can be run standalone for development:

```bash
# Example: run the doctor service
cd backend/doctor-service
npm install
npm run dev
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Each service reads from its own `.env` file. Below are the key variables per service.

**api-gateway** (`.env`)
```env
PORT=8080
USER_SERVICE_URL=http://localhost:5001
DOCTOR_SERVICE_URL=http://localhost:5002
APPOINTMENT_SERVICE_URL=http://localhost:5003
AI_SERVICE_URL=http://localhost:5004
VIDEO_SERVICE_URL=http://localhost:5005
NOTIFICATION_SERVICE_URL=http://localhost:5006
FEE_SERVICE_URL=http://localhost:5007
PAYMENT_SERVICE_URL=http://localhost:5009
ALLOWED_ORIGINS=http://localhost:9000
```

**user-patient-service** (`.env`)
```env
PORT=5001
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
ALLOWED_ORIGINS=http://localhost:9000
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud>
CLOUDINARY_API_KEY=<cloudinary-key>
CLOUDINARY_API_SECRET=<cloudinary-secret>
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**ai-symptom-service** (`.env`)
```env
PORT=5004
GEMINI_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL=gemini-3-flash-preview
```

**notification-service** (`.env`)
```env
PORT=5006
MONGO_URI=<mongodb-connection-string>
RABBITMQ_URL=amqp://guest:guest@localhost:5672
GMAIL_USER=<gmail-address>
GMAIL_PASS=<gmail-app-password>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_PHONE_NUMBER=<twilio-number>
INTERNAL_SERVICE_KEY=<shared-internal-key>
```

**payment-service** (`.env`)
```env
PORT=5009
MONGO_URI=<mongodb-connection-string>
PAYHERE_MERCHANT_ID=<merchant-id>
PAYHERE_MERCHANT_SECRET=<merchant-secret>
PAYHERE_BASE_URL=https://sandbox.payhere.lk/pay/checkout
JWT_SECRET=<your-jwt-secret>
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

> All other services follow the same pattern: `PORT`, `MONGO_URI`, `JWT_SECRET`, `RABBITMQ_URL`, `ALLOWED_ORIGINS`.

---

## API Gateway Routes

All requests go through `http://localhost:8080`.

| Prefix | Target Service |
|---|---|
| `POST /api/auth/*` | user-patient-service |
| `GET/PUT /api/patient/*` | user-patient-service |
| `GET/PUT /api/admin/*` | user-patient-service |
| `GET /api/doctors/search` | appointment-service |
| `* /api/doctors/*` | doctor-service |
| `* /api/availability/*` | doctor-service (fallback: appointment-service) |
| `* /api/prescriptions/*` | doctor-service |
| `* /api/appointments/*` | appointment-service (with fallbacks) |
| `* /api/ai/*` | ai-symptom-service |
| `* /api/payments/*` | payment-service |
| `* /api/service-fee/*` | fee-management-service |
| `* /api/hospitals/*` | fee-management-service |
| `* /api/notifications/*` | notification-service |
| `* /api/video/*` | video-session-integration-service |
| `GET /health` | gateway health check |

---

## Kubernetes Deployment

Kubernetes manifests are in the `k8s/` directory. All resources are scoped to the `nexuscare` namespace.

```bash
# Create namespace
kubectl apply -f k8s/nexuscare-namespace.yaml

# Apply RBAC
kubectl apply -f k8s/nexuscare-rbac.yaml

# Apply ConfigMap and Secrets
kubectl apply -f k8s/nexuscare-config.yaml

# Deploy all services
kubectl apply -f k8s/nexuscare-deployments.yaml

# Apply resource quotas
kubectl apply -f k8s/nexuscare-resources.yaml
```

The API gateway is exposed as a `NodePort` service on port `30080`. Each service has liveness and readiness probes configured at `/health` and `/ready` endpoints.

> Before deploying to production, rotate all secrets in `nexuscare-config.yaml` and use a proper secrets manager rather than plaintext `stringData`.

---

## Testing

**Doctor Service** (Node built-in test runner)
```bash
cd backend/doctor-service
npm test
```

**Video Session Service** (Node built-in test runner)
```bash
cd backend/video-session-integration-service
npm test
```

**Notification Service** (Jest)
```bash
cd backend/notification-service
npm test
```

Frontend linting:
```bash
cd frontend
npm run lint
```
