'use strict'

import twilio from 'twilio'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'

/**
 * Upon receiving signals.tryTurn from the initiator, get TURN servers
 * and credentials from Twilio. Send the response to the initiator
 * via the signals.turnToken signal, and signal to the receiver that
 * the initiator is attempting to connect via TURN servers by
 * the signals.attemptingTurn signal.
 *
 * @param  {Object} event - Original connection event payload from AWS
 * @param  {String} event.body - Payload object string to parse
 */
const handler = async (event, context) => {
  log.info('TryTurn event', { event })
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const body = JSON.parse(event.body)

  // Connection pair info //
  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const initiator = pair.find(obj => {
    return obj.role === roles.initiator
  })
  const receiver = pair.find(obj => {
    return obj.role === roles.receiver
  })
  log.info('Connection Pair', { entry, pair, initiator, receiver })

  // Create Turn Server credentials //
  log.info('Creating TURN server credentials...')
  const turnServerCredentials = await createTurnServerCredentials()

  // Handle possible error //
  if (turnServerCredentials.error) {
    return { statusCode: 500, body: 'Error Creating TURN Credentials' }
  }

  // Crated successfully //
  log.info('TURN server credentials created', { turnServerCredentials })

  const initiatorPostData = {
    signal: signals.turnToken,
    data: turnServerCredentials,
    message: 'TURN server credentials created'
  }

  const receiverPostData = {
    signal: signals.attemptingTurn,
    data: {
      data: turnServerCredentials.iceServers.map((s) => {
        s.url = s.urls;
        return s;
      }),
    },
    message: 'TURN server credentials created'
  }

  await postMessage(endpoint, initiator.connectionId, initiatorPostData)
  await postMessage(endpoint, receiver.connectionId, receiverPostData)
  log.info('Sent TURN server credentials')
  return { statusCode: 200, body: 'Data Sent' }
}

const createTurnServerCredentials = async () => {
  return new Promise((resolve, reject) => {
    const client = twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN)
    client.tokens
      .create({ ttl: process.env.TWILIO_TTL })
      .then(message => {
        resolve(message)
      })
      .catch(err => {
        log.warn('Error creating TURN server', { err })
        reject({
          error: err
        })
      })
  })
}

export { handler }
