'use strict'

import AWS from 'aws-sdk'
import '@util/aws/clients/apigatewaymanagementapi'

/**
 * Emit/post a WebSocket data payload to a particular endpoint/connectionId.
 *
 * @param  {String} endpoint - Endpoint to post to
 *                             (i.e. event.requestContext.domainName + '/' + event.requestContext.stage)
 * @param  {String} connectionId - connectionId of the client to send the message to
 * @param  {String} data - Data payload to send. This can be an object. It will be converted to a string
 * @return {Object} - Response{ statusCode, body }
 */
export default async (endpoint, connectionId, data) => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: endpoint
  })

  // Convert to string if applicable //
  data =
    typeof data === 'object' || typeof data === 'array'
      ? JSON.stringify(data)
      : data

  try {
    await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: data })
      .promise()
    return { statusCode: 200, body: 'Data Sent' }
  } catch (e) {
    return { statusCode: 500, body: e }
  }
}
