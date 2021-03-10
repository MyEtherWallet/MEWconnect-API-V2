'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'

/**
 * Upon receiving signals.rtcConnected from the initiator or receiver,
 * relay successful 'disconnect' signal, signifying that the socket connection
 * will be closed. Then, delete/cleanup the given entry from dynamoDB.
 *
 * @param  {Object} event - Original connection event payload from AWS
 * @param  {String} event.body - Payload object string to parse
 * @param  {Object} event.body.data - The actual payload sent by the initiator/receiver
 */
const handler = async (event, context) => {
  log.info('RtcConnected event', { event })
  const connectionId = event.requestContext.connectionId
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const body = JSON.parse(event.body)
  const data = body.data

  try {
    const entry = await query.byConnectionId(connectionId)
    log.info('Connection entry', { entry })
  } catch (e) {
    log.warn('No such connection exists', { error: e, connectionId })
    return { statusCode: 500, body: 'No such connection exists.' }
  }

  const postData = {
    signal: signals.disconnect,
    message: 'WebRTC Connection Established. Ready for disconnect.'
  }

  await postMessage(endpoint, connectionId, postData)
  // await dynamoDocumentClient.delete({ connectionId: connectionId })
  log.info('WebRTC Connection Established. Ready for disconnect.', {
    connectionId
  })
  return { statusCode: 200, body: 'Data Sent' }
}

export { handler }
