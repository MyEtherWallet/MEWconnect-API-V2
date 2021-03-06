'use strict'

import middy from 'middy'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import * as middleware from '@util/middleware'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'
import { validateSignal } from '@util/validation'

/**
 * Upon receiving signals.offerSignal from the initiator, validate the payload,
 * and relay the message payload to the receiver so that they can create an answer to webRTC offer.
 *
 * @param  {Object} event - Original connection event payload from AWS
 * @param  {String} event.body - Payload object string to parse
 * @param  {Object} event.body.data - The actual payload sent by the initiator
 */
const handler = middy(async (event, context) => {
  log.info('Offer event', { event })
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const body = JSON.parse(event.body)
  const data = body.data

  // Connection pair info //
  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const receiver = pair.find(obj => {
    return obj.role === roles.receiver
  })

  log.info('Connection Pair', { entry, pair, receiver })

  const postData = {
    signal: signals.offer,
    data: data,
    message: 'Initiator sent WebRTC Offer. Please respond.'
  }

  await postMessage(endpoint, receiver.connectionId, postData)
  log.info('Sent offer signal', { postData })
  return { statusCode: 200, body: 'Data Sent' }
}).use(middleware.validateMessageSignal())

export { handler }
