'use strict'

import query from '@util/query'
import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import { validConnId, validHex, validRole } from '@util/validation'
import { signals, roles } from '@util/signals'

/**
 * Handle an incoming WebSocket connection and update the dynamoDB database with pertinent information.
 * The handling of a request will be different depending on whether the given query parameter @role
 * is "initiator" or "receiver".
 * The initial connection request must have the following query parameters 
 * or the client will not be able to attempt a connection:
 * 
 * @param  {String} role - initiator or receiver
 * @param  {String} connId - Last 32 characters of the public key portion of the key-pair
 *                           created for the particular paired connection
 * @param  {String} signed - Private key signed with the private key created for the connection
 */
const handler = async (event, context) => {
  const connectionId = event.requestContext.connectionId
  const query = event.queryStringParameters || {}
  const role = query.role || null
  const connId = query.connId || null
  const signed = query.signed || null

  if (!validRole(role)) return { statusCode: 500, body: 'Failed to connect: Invalid @role' }
  if (!validConnId(connId)) return { statusCode: 500, body: 'Failed to connect: Invalid @signed' }
  if (!validHex(signed)) return { statusCode: 500, body: 'Failed to connect: Invalid @signed' }

  const connectionData = {
    connectionId,
    query,
    event
  }

  switch (role) {
    case roles.initiator:
      return await handleInitiator(connectionData)
    case roles.receiver:
      return await handleReceiver(connectionData)
  }
}

/**
 * Create a connection entry with key @connId and initiator details. After successful creation of the entry, 
 * connect the initiator client.
 * 
 * @param  {Object} connectionData - Initial connection/handshake data provided by the initiator
 * @param  {String} connectionData.connectionId - The original connectionId provided/generated by AWS
 * @param  {String} connectionData.query - The handshake/query params provided by the initiator
 * @param  {String} connectionData.query.connId - The client-supplied connection string generated and supplied by the initiator.
 * @param  {String} connectionData.query.signed - The private key signed with the private key generated and supplied by the initiator.
 */
const handleInitiator = async (connectionData) => {
  // Ensure an entry with given @connId does not already exist //
  let entries = await query.byConnId(connectionData.query.connId)
  if (entries.length > 0) return { statusCode: 500, body: `Failed to connect: @connId already exists!` }

  const putParams = {
    connectionId: connectionData.connectionId,
    connId: connectionData.query.connId,
    role: roles.initiator,
    signed: connectionData.query.signed,
    endpoint: connectionData.event.requestContext.domainName + '/' + connectionData.event.requestContext.stage
  }

  try {
    await dynamoDocumentClient.put(putParams)
    return { statusCode: 200, body: `Connected` }
  } catch (e) {
    return { statusCode: 500, body: `Failed to connect: ${JSON.stringify(e)}` }
  }
}

/**
 * Search for a matching @connId entry that should have been previously provided/created
 * by the initiator. Ensure that the @signed provided by the initiator and receiver match,
 * so that they can be securely paired. If so, update the connection entry and connect the
 * receiver client.
 * 
 * @param  {Object} connectionData - Initial connection/handshake data provided by the receiver
 * @param  {String} connectionData.connectionId - The original connectionId provided/generated by AWS
 * @param  {String} connectionData.query - The handshake/query params provided by the receiver
 * @param  {String} connectionData.query.connId - The client-supplied connection string originally generated and supplied
 *                                                by the initiator.
 * @param  {String} connectionData.query.signed - The private key signed with the private key originally generated and supplied
 *                                                by the initiator.
 */
const handleReceiver = async (connectionData) => {
  let entries = await query.byConnId(connectionData.query.connId)
  if (entries.length === 0) return { statusCode: 500, body: `Failed to connect: Connection pair doesn't exist!` }
  if (entries.length >= 2) return { statusCode: 500, body: `Failed to connect: A connection pair already exists for this @connId` }

  
  // Check to ensure that given @signed matches what was originally provided by the initiator //
  let initiator = entries[0]
  if (initiator.role !== roles.initiator) return { statusCode: 500, body: 'Failed to connect: Initiator has disconnected' }
  if (connectionData.query.signed !== initiator.signed) return { statusCode: 500, body: 'Failed to connect: Invalid @signed' }

  // Update entry with receiver information //
  const putParams = {
    connectionId: connectionData.connectionId,
    connId: connectionData.query.connId,
    role: roles.receiver,
    signed: connectionData.query.signed,
    endpoint: connectionData.event.requestContext.domainName + '/' + connectionData.event.requestContext.stage
  }

  // Perform update //
  try {
    await dynamoDocumentClient.put(putParams)
    return { statusCode: 200, body: `Connected` }
  } catch (e) {
    return { statusCode: 500, body: `Failed to connect: ${JSON.stringify(e)}` }
  }
}

export { handler }