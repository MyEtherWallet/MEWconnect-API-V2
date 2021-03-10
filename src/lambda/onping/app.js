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
const handler = async (event, context) => {
  log.info('Ping', { event })
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage

  // Connection pair info //
  const entry = await query.byConnectionId(connectionId)

  const postData = {
    signal: signals.pong,
    data: '',
    message: 'pong'
  }

  await postMessage(endpoint, entry.connectionId, postData)
  log.info('Sent answer signal', { postData })
  return { statusCode: 200, body: 'Data Sent' }
}

export { handler }
