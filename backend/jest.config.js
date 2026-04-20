/**
 * jest.config.js — Configuración de Jest para el backend
 *
 * testEnvironment: 'node'  → sin DOM, más rápido para APIs Express
 * testMatch               → solo archivos dentro de tests/
 * clearMocks              → limpia historial de llamadas entre tests (pero preserva implementaciones)
 *                           cada test debe configurar sus propios mockResolvedValueOnce
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  testTimeout: 10000,
}
