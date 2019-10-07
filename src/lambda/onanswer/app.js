'use strict'

import middy from 'middy'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import * as middleware from '@util/middleware'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'

/**
 * Upon receiving signals.answerSignal from the receiver, relay the message payload
 * to the initiator so that they can establish a P2P WebRTC connection with the receiver.
 *
 * @param  {Object} event - Original connection event payload from AWS
 * @param  {String} event.body - Payload object string to parse
 * @param  {Object} event.body.data - The actual payload sent by the receiver
 */
const handler = middy(async (event, context) => {
  log.info('Answer event', { event })
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const body = JSON.parse(event.body)
  const data = body.data

  // Connection pair info //
  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const initiator = pair.find(obj => {
    return obj.role === roles.initiator
  })
  log.info('Connection Pair', { entry, pair, initiator })

  const postData = {
    signal: signals.answer,
    data: data,
    message: 'Receiver sent WebRTC Answer.'
  }

  await postMessage(endpoint, initiator.connectionId, postData)
  log.info('Sent answer signal', { postData })
  return { statusCode: 200, body: 'Data Sent' }
}).use(middleware.validateMessageSignal())

export { handler }
