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
  const endpoint =
    event.requestContext.domainName + '/' + event.requestContext.stage
  const deleteParams = {
    connectionId: connectionId
  }

  // Connection pair info - get opposite of disconnect //
  const entry = await query.byConnectionId(connectionId)
  const pair = await query.byConnId(entry.connId)
  const other = pair.find(obj => {
    return obj.connectionId !== connectionId
  })

  // Send message to other pair that the current rol has disconnected //
  try {
    if (other) {
      const postData = {
        signal: signals.disconnected,
        data: '',
        message: `${entry.role} has disconnected`
      }
      await postMessage(other.endpoint, other.connectionId, postData)
    }
  } catch (e) {
    log.warn('Other pair already disconnected', { pair })
  }

  // Delete from DB //
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
