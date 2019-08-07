'use strict'

import log from '@util/log'
import { validConnId, validHex, validRole } from '@util/validation'

/**
 * Middleware to validate the parameters necessary for successful onconnect
 */
const validateConnectionParameters = () => {
  return {
    before: async handler => {
      const event = handler.event
      const query = event.queryStringParameters || {}
      const role = query.role || null
      const connId = query.connId || null
      const signed = query.signed || null
      log.info('Validating connection parameters...', { query })

      const isValidRole = validRole(role)
      if (!isValidRole) {
        log.warn('Invalid @role parameter', { event, query, role })
        return { statusCode: 500, body: 'Failed to connect: Invalid @role' }
      }

      const isValidConnId = validConnId(connId)
      if (!isValidConnId) {
        log.warn('Invalid @connId parameter', { event, query, connId })
        return { statusCode: 500, body: 'Failed to connect: Invalid @connId' }
      }

      const isValidSigned = validHex(signed)
      if (!isValidSigned) {
        log.warn('Invalid @signed parameter', { event, query, signed })
        return { statusCode: 500, body: 'Failed to connect: Invalid @signed' }
      }

      log.info('Successful validation of connection parameters')
      return
    }
  }
}

export { validateConnectionParameters }
