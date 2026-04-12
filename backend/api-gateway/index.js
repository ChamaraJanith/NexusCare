import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import httpProxy from 'http-proxy'

const app = express()
const proxy = httpProxy.createProxyServer({})

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:9000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message)
  res.writeHead(502, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }))
})

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
      user:         process.env.USER_SERVICE_URL,
      doctor:       process.env.DOCTOR_SERVICE_URL,
      appointment:  process.env.APPOINTMENT_SERVICE_URL,
      ai:           process.env.AI_SERVICE_URL,
      video:        process.env.VIDEO_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL,
      fee:          process.env.FEE_SERVICE_URL,
      payment:      process.env.PAYMENT_SERVICE_URL,
    }
  })
})

const route = (target) => (req, res) => {
  // http-proxy strips the matched prefix — restore the original full URL
  req.url = req.originalUrl
  proxy.web(req, res, { target, changeOrigin: true })
}

app.use('/api/auth',          route(process.env.USER_SERVICE_URL))
app.use('/api/patient',       route(process.env.USER_SERVICE_URL))
app.use('/api/admin',         route(process.env.USER_SERVICE_URL))
// Doctor search goes via appointment-service (has cache fallback)
// All other /api/doctors routes go directly to doctor-service
app.use('/api/doctors/search', route(process.env.APPOINTMENT_SERVICE_URL))
app.use('/api/doctors',        route(process.env.DOCTOR_SERVICE_URL))
app.use('/api/availability',  route(process.env.DOCTOR_SERVICE_URL))
app.use('/api/prescriptions', route(process.env.DOCTOR_SERVICE_URL))
app.use('/api/appointments',  route(process.env.APPOINTMENT_SERVICE_URL))
app.use('/api/ai',            route(process.env.AI_SERVICE_URL))
app.use('/api/payments',      route(process.env.PAYMENT_SERVICE_URL))
app.use('/api/service-fee',   route(process.env.FEE_SERVICE_URL))
app.use('/api/hospitals',     route(process.env.FEE_SERVICE_URL))
app.use('/api/notifications', route(process.env.NOTIFICATION_SERVICE_URL))
app.use('/api/video',         route(process.env.VIDEO_SERVICE_URL))

app.listen(process.env.PORT || 8080, () => {
  console.log(`Gateway running on :${process.env.PORT || 8080}`)
  console.log(`user-service → ${process.env.USER_SERVICE_URL}`)
})
