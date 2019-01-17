'use strict'

import postMessage from '@util/aws/functions/post-message'
import { signals, stages } from '@util/signals'

/**
 * On DynamoDB entry trigger, handle/process the event according to the signal.
 * 
 * @param  {Object} event - Event object passed from AWS
 */
const handler = async (event, context) => {
  const entry = event.Records[0].dynamodb.NewImage
  const signal = entry.signal.S

  switch (signal) {
    case signals.initiated:
      return await handleInitiated(entry)
    case signals.confirmation:
      return await handleConfirmation(entry)
    default:
      return
  }
}

/**
 * Handle signals.initiated signal. Send confirmation message to initiator.
 * 
 * @param  {Object} entry - New/updated DynamoDB entry
 */
const handleInitiated = async (entry) => {
  const signal = entry.signal.S
  const endpoint = entry.endpoint.S
  const initiator = entry.initiator.M
  const connectionId = initiator.connectionId.S

  const postData = {
    signal: signal,
    data: '',
    message: 'Connected. Waiting for receiver.'
  }

  return await postMessage(endpoint, connectionId, postData)
}

/**
 * Handle signals.confirmation signal. Send confirmation to both initiator and receiver.
 * 
 * @param  {Object} entry - New/updated DynamoDB entry
 */
const handleConfirmation = async (entry) => {
  const signal = entry.signal.S
  const endpoint = entry.endpoint.S
  const initiator = entry.initiator.M
  const receiver = entry.receiver.M
  const connectionIdInitiator = initiator.connectionId.S 
  const connectionIdReceiver = receiver.connectionId.S

  const postDataInitiator = {
    signal: signal,
    data: '',
    message: 'Receiver Connected. Please Create WebRTC Offer.'
  }

  const postDataReceiver = {
    signal: signal,
    data: '',
    message: 'Connected. Awaiting WebRTC Offer Details.'
  }

  await postMessage(endpoint, connectionIdInitiator, postDataInitiator)
  await postMessage(endpoint, connectionIdReceiver, postDataReceiver)
}

export { handler }