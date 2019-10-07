'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'
import log from '@util/log'
import postMessage from '@util/aws/functions/post-message'
import query from '@util/aws/functions/query'
import { signals, roles } from '@util/signals'

/**
 * On DynamoDB entry trigger, handle/process the event according to the client's role.
 *
 * @param  {Object} event - Event object passed from AWS
 * @param  {Array} event.Records - The DB entry that triggered this event. Because the threshold
 *                                 is set to 1, this will be an array of 1 record, with the 0 index
 *                                 being the most recently triggered entry.
 */
const handler = async (event, context) => {
  const record = event.Records[0]
  const eventName = record.eventName
  log.info('DB Event', { event, record })

  if (eventName !== 'INSERT') return

  const entry = record.dynamodb.NewImage
  const role = entry.role.S

  log.info('New connection entry', { entry, role })
  switch (role) {
    case roles.initiator:
      return await handleInitiator(entry)
    case roles.receiver:
      return await handleReceiver(entry)
    default:
      return
  }
}

/**
 * Handle initiator. Send initiated signal payload to initiator.
 *
 * @param  {Object} entry - New/updated DynamoDB entry
 */
const handleInitiator = async entry => {
  const connectionId = entry.connectionId.S
  const endpoint = entry.endpoint.S

  const postData = {
    signal: signals.initiated,
    data: '',
    message: 'Connected. Waiting for receiver.'
  }

  log.info('Initiator Connected. Waiting for receiver.', { postData })
  return await postMessage(endpoint, connectionId, postData)
}

/**
 * Handle receiver connection. Send confirmation to both initiator and receiver.
 *
 * @param  {Object} entry - New/updated DynamoDB entry
 */
const handleReceiver = async entry => {
  const connectionId = entry.connectionId.S
  const connId = entry.connId.S
  const endpoint = entry.endpoint.S

  // Find initiator/receiver pair by connId //
  const pair = await query.byConnId(connId)
  const initiator = pair.find(obj => {
    return obj.role === roles.initiator
  })
  const receiver = pair.find(obj => {
    return obj.role === roles.receiver
  })

  // Handle possible error //
  if (pair.length < 2) {
    log.warn('Connection pair missing role', { pair })
    return
  }

  // Post confirmation signal payloads to both initiator and receiver //
  const postDataInitiator = {
    signal: signals.confirmation,
    data: '',
    message: 'Receiver Connected. Please Create WebRTC Offer.'
  }
  const postDataReceiver = {
    signal: signals.confirmation,
    data: '',
    message: 'Connected. Awaiting WebRTC Offer Details.'
  }

  log.info('Receiver connected. Initiator must create WebRTC Offer', {
    pair,
    postDataInitiator,
    postDataReceiver
  })
  await postMessage(endpoint, initiator.connectionId, postDataInitiator)
  await postMessage(endpoint, receiver.connectionId, postDataReceiver)
}

export { handler }
