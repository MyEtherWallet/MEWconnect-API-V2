'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
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
  const connectionId = event.requestContext.connectionId
  const endpoint = event.requestContext.domainName + '/' + event.requestContext.stage
  const data = JSON.parse(event.body).data

  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const initiator = pair.find(obj => {
    return obj.role === roles.initiator
  })


  const postData = {
    signal: signals.answer,
    data: data,
    message: 'Receiver sent WebRTC Answer.'
  }
  console.log('yyyy', initiator, postData)

  await postMessage(endpoint, initiator.connectionId, postData)
  return { statusCode: 200, body: 'Data Sent' }
}

export { handler }