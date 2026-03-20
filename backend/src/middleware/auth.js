const jwt = require('jsonwebtoken')

function extractBearerToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  return token
}

module.exports = function auth(req, res, next) {
  console.log('auth middleware:', req.method, req.path)
  const token = extractBearerToken(req)
  if (!token) return res.status(401).json({ message: 'Unauthorized' })

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ message: 'Server misconfiguration' })

    const decoded = jwt.verify(token, secret)

    // Mantener el payload estrictamente como se solicita.
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    return next()
  } catch (_err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
