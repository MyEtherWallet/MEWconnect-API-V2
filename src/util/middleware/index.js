'use strict'

import log from '@util/log'
import {
  validConnId,
  validHex,
  validRole,
  validateSignal
} from '@util/validation'

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

/**
 * Validate a particular message's signal against its body data
 */
const validateMessageSignal = () => {
  return {
    before: async handler => {
      const event = handler.event
      const body = JSON.parse(event.body)
      const data = body.data
      log.info('Validating message signal...', {
        signal: event.requestContext.routeKey,
        data
      })

      try {
        await validateSignal({
          signal: event.requestContext.routeKey,
          data: data
        })
      } catch (e) {
        log.warn('Invalid signal parameters', { event, error: e })
        return { statusCode: 500, body: 'Invalid signal params' }
      }

      log.info('Successful validation of message signal')
      return
    }
  }
}

export { validateConnectionParameters, validateMessageSignal }
