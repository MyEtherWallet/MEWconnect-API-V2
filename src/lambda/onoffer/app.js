'use strict'

import query from '@util/query'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import postMessage from '@util/aws/functions/post-message'
import { signals, roles } from '@util/signals'

const handler = async (event, context) => {
  const connectionId = event.requestContext.connectionId
  const endpoint = event.requestContext.domainName + '/' + event.requestContext.stage
  const message = JSON.parse(event.body).data

  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const receiver = pair.find(obj => {
    return obj.role === roles.receiver
  })

  const postData = {
  	signal: signals.offer,
  	data: message,
  	message: 'Initiator sent WebRTC Offer. Please respond.'
  }

  await postMessage(endpoint, receiver.connectionId, postData)
  return { statusCode: 200, body: 'Data Sent' }

}

export { handler }