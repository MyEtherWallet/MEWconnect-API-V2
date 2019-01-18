'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import { signals } from '@util/signals'

const handler = async (event, context) => {
  const connectionId = event.requestContext.connectionId
  const message = JSON.parse(event.body).data
  const query = event.queryStringParameters || {}
  console.log('q', query)
  return
}

export { handler }