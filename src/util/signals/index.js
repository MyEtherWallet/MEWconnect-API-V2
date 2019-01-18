'use strict'

const signals = {
  attemptingTurn: 'attemptingTurn',
  turnToken: 'turnToken',
  tryTurn: 'tryTurn',
  connect: 'connect',
  connection: 'connection',
  signature: 'signature',
  offerSignal: 'offerSignal',
  offer: 'offer',
  answerSignal: 'answerSignal',
  answer: 'answer',
  initiated: 'initiated',
  rtcConnected: 'rtcConnected',
  disconnect: 'disconnect',
  handshake: 'handshake',
  confirmation: 'confirmation',
  socketTimeout: 'socketTimeout',
  invalidConnection: 'InvalidConnection',
  confirmationFailedBusy: 'confirmationFailedBusy',
  confirmationFailed: 'confirmationFailed',
  receivedSignal: 'receivedSignal',
  error: 'error'
}

const roles = {
  initiator: 'initiator',
  receiver: 'receiver'
}

const rtcSignals = {
  error: 'error',
  connect: 'connect',
  close: 'close',
  data: 'data',
  signal: 'signal'
}

export { signals, roles, rtcSignals }