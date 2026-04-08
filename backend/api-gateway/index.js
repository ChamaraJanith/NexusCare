import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:9000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-service-key']
}))

// Route each path prefix to the correct service
app.use('/api/auth',         createProxyMiddleware({ target: process.env.USER_SERVICE_URL,        changeOrigin: true }))
app.use('/api/patient',      createProxyMiddleware({ target: process.env.USER_SERVICE_URL,        changeOrigin: true }))
app.use('/api/admin',        createProxyMiddleware({ target: process.env.USER_SERVICE_URL,        changeOrigin: true }))
app.use('/api/doctors',      createProxyMiddleware({ target: process.env.DOCTOR_SERVICE_URL,      changeOrigin: true }))
app.use('/api/appointments', createProxyMiddleware({ target: process.env.APPOINTMENT_SERVICE_URL, changeOrigin: true }))
app.use('/api/ai',           createProxyMiddleware({ target: process.env.AI_SERVICE_URL,          changeOrigin: true }))
app.use('/api/payments',     createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL,     changeOrigin: true }))
app.use('/api/service-fee',  createProxyMiddleware({ target: process.env.FEE_SERVICE_URL,         changeOrigin: true }))
app.use('/api/notifications',createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL,changeOrigin: true }))
app.use('/api/video',        createProxyMiddleware({ target: process.env.VIDEO_SERVICE_URL,       changeOrigin: true }))

app.listen(process.env.PORT || 8080, () => console.log('Gateway running on :8080'))
