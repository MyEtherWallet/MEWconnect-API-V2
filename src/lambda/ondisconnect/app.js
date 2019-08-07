'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'

/**
 * On client disconnect from WebSocket client, delete records with
 * matching Key @connectionId.
 *
 * @param  {Object} event - Original connection event payload from AWS
 */
const handler = async (event, context) => {
  log.info('Disconnect event', { event })
  const connectionId = event.requestContext.connectionId
  const deleteParams = {
    connectionId: connectionId
  }

  try {
    await dynamoDocumentClient.delete(deleteParams)
    log.info('Deleted connection entry', { connectionId })
    return { statusCode: 200, body: `DB Entry ${connectionId} Deleted` }
  } catch (e) {
    log.warn('Failed to delete DB entry', { error: e, connectionId })
    return {
      statusCode: 500,
      body: `Failed to Delete DB Entry ${connectionId}`
    }
  }
}

export { handler }
