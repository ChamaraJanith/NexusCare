import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import httpProxy from 'http-proxy'

const app = express()
const proxy = httpProxy.createProxyServer({})

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001'
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002'
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003'
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5004'
const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || 'http://localhost:5005'
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006'
const FEE_SERVICE_URL = process.env.FEE_SERVICE_URL || 'http://localhost:5007'
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5009'

const route = (target, label) => (req, res) => {
  if (!target) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Bad Gateway', message: `${label} target not configured` }))
  }

  req.url = req.originalUrl
  proxy.web(req, res, { target, changeOrigin: true })
}

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:9000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
)

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message)
  res.writeHead(502, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }))
})

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-service-key']
}))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    routes: {
      user:         USER_SERVICE_URL,
      doctor:       DOCTOR_SERVICE_URL,
      appointment:  APPOINTMENT_SERVICE_URL,
      ai:           AI_SERVICE_URL,
      video:        VIDEO_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL,
      fee:          FEE_SERVICE_URL,
      payment:      PAYMENT_SERVICE_URL,
    }
  })
})

app.use('/api/auth',          route(USER_SERVICE_URL, 'user-service'))
app.use('/api/patient',       route(USER_SERVICE_URL, 'user-service'))
app.use('/api/admin',         route(USER_SERVICE_URL, 'user-service'))
// Doctor search goes via appointment-service (has cache fallback)
// All other /api/doctors routes go directly to doctor-service
app.use('/api/doctors/search', route(APPOINTMENT_SERVICE_URL, 'appointment-service'))
app.use('/api/doctors/internal', route(APPOINTMENT_SERVICE_URL, 'appointment-service'))
app.use('/api/doctors',        route(DOCTOR_SERVICE_URL, 'doctor-service'))
app.use('/api/availability',   route(APPOINTMENT_SERVICE_URL, 'appointment-service'))
app.use('/api/prescriptions',  route(DOCTOR_SERVICE_URL, 'doctor-service'))
app.use('/api/appointments',   route(APPOINTMENT_SERVICE_URL, 'appointment-service'))
app.use('/api/ai',             route(AI_SERVICE_URL, 'ai-service'))
app.use('/api/payments',       route(PAYMENT_SERVICE_URL, 'payment-service'))
app.use('/api/service-fee',    route(FEE_SERVICE_URL, 'fee-service'))
app.use('/api/hospitals',      route(FEE_SERVICE_URL, 'fee-service'))
app.use('/api/notifications',  route(NOTIFICATION_SERVICE_URL, 'notification-service'))
app.use('/api/video',          route(VIDEO_SERVICE_URL, 'video-service'))

app.listen(process.env.PORT || 8080, () => {
  console.log(`Gateway running on :${process.env.PORT || 8080}`)
  console.log(`user-service → ${process.env.USER_SERVICE_URL}`)
})
