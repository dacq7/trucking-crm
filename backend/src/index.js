require('dotenv').config()

const cors = require('cors')
const express = require('express')

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const authRoutes = require('./routes/auth.routes')
app.use('/api/auth', authRoutes)

const dashboardRoutes = require('./routes/dashboard.routes')
app.use('/api/dashboard', dashboardRoutes)

const clientsRoutes = require('./routes/clients.routes')
app.use('/api/clients', clientsRoutes)

const casesRoutes = require('./routes/cases.routes')
app.use('/api/cases', casesRoutes)

const policiesRoutes = require('./routes/policies.routes')
app.use('/api/policies', policiesRoutes)

const usersRoutes = require('./routes/users.routes')
app.use('/api/users', usersRoutes)

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
