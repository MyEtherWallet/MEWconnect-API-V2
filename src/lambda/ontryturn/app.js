'use strict'

import twilio from 'twilio'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
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
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const body = JSON.parse(event.body)

  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const initiator = pair.find(obj => {
    return obj.role === roles.initiator
  })
  const receiver = pair.find(obj => {
    return obj.role === roles.receiver
  })

  const turnServerCredentials = await createTurnServerCredentials()

  const initiatorPostData = {
    signal: signals.turnToken,
    data: turnServerCredentials,
    message: 'TURN server credentials created'
  }

  const receiverPostData = {
    signal: signals.attemptingTurn,
    data: {},
    message: 'TURN server credentials created'
  }

  await postMessage(endpoint, initiator.connectionId, initiatorPostData)
  await postMessage(endpoint, receiver.connectionId, receiverPostData)
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
        reject(err)
      })
  })
}

export { handler }
