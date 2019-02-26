'use strict'

// Imports //
import _ from 'lodash'
import Peer from 'simple-peer'
import queryString from 'query-string'
import randomstring from 'randomstring'
import WebSocketClient from 'promise-ws'
import wrtc from 'wrtc'

// Libs //
import CryptoUtils from '@utils/crypto-utils'
import { signals, rtcSignals, roles } from '@signals'

/*
===================================================================================
  Test "Member Variables"
===================================================================================
*/

// WebSocket URL Address //
const websocketURL = 'wss://22jmo882mb.execute-api.us-west-1.amazonaws.com/dev?'

// WebRTC Variables //
const stunServers = [{ urls: 'stun:global.stun.twilio.com:3478?transport=udp' }]
const defaultWebRTCOptions = {
  trickle: false,
  iceTransportPolicy: 'relay',
  config: {
    iceServers: stunServers
  },
  wrtc: wrtc
}

// Key Variables //
let publicKey
let privateKey
let connId
let signed
let versionObject
const version = '0.0.1'

// Initiatior Object //
let initiator = {
  socket: {},
  version: {},
  peer: {},
  answer: {},
  listener: {}
}

// Receiver Object //
let receiver = {
  socket: {},
  version: {},
  peer: {},
  offer: {},
  listener: {}
}

/*
===================================================================================
  Test "Member Functions"
===================================================================================
*/

/**
 * Connect to a given WebSocket @url
 * 
 * @param  {Object} options - JSON-formatted connection query params
 * @return {Object} WebSocket Connection object
 */
const connect = async (options = {}) => {
  let url = `${websocketURL}${queryString.stringify(options)}`
  let connection = await WebSocketClient.create(url)
  return connection
}

/**
 * Set an 'on message' listener function for a given role (initiator or receiver)
 * 
 * @param  {Object} role - initiator or receiver object
 * @param  {Function} fn - Function to perform on message
 */
const setListener = async (role, fn) => {
  role.listener = fn
  role.socket.on('message', fn)
}

/**
 * Remove 'on message' listener function for a given role (initiator or receiver)
 * 
 * @param  {Object} role - initiator or receiver object
 */
const removeListener = async (role) => {
  try {
    role.socket.removeListener('message', role.listener)
  } catch (e) {
    // No listener
  }
}

/**
 * Set a timeout to perform callback after process.env.CONNECTION_TIMEOUT
 * @param  {Function} done - Callback function to perform (usually passing a test)
 */
const pass = async done => {
  setTimeout(done, process.env.CONNECTION_TIMEOUT)
}

/*
===================================================================================
  Test Start
===================================================================================
*/
describe('Pairing', () => {

  /**
   * Before all tests, get the generate keys used for communication.
   */
  beforeAll(async done => {
    // Keys / Connection Details //
    let keys = CryptoUtils.generateKeys()
    publicKey = keys.publicKey
    privateKey = keys.privateKey
    connId = CryptoUtils.generateConnId(publicKey)
    signed = CryptoUtils.signMessage(privateKey, privateKey)
    versionObject = await CryptoUtils.encrypt(version, privateKey)

    done()
  })

  afterEach(async done => {
    removeListener(initiator)
    removeListener(receiver)
    done()
  })

  /*
  ===================================================================================
    1. Pairing -> Initial Connection
  ===================================================================================
  */
  describe('Initial Connection', () => {
    /*
    ===================================================================================
      1a. Pairing -> Initial Connection -> Connect [Initiator → Server]
    ===================================================================================
    */
    describe('Connect [Initiator → Server]', () => {
      let connectionOptions

      beforeAll(() => {
        connectionOptions = {
          role: roles.initiator,
          connId: connId,
          signed: signed
        }
      })

      /*
      ===================================================================================
        1a. Pairing -> Initial Connection -> Connect [Initiator → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not connect with missing @role property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.role
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with missing @role property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @role property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.role = 'invalid'
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with invalid @role property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.connId
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with missing @connId property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.connId = 'invalid'
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with invalid @connId property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @signed property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.signed
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with missing @signed property')
          } catch (e) {
            done()
          }
        })
      })

      /*
      ===================================================================================
        1a. Pairing -> Initial Connection -> Connect [Initiator → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should initiate socket connection', async done => {
          let options = _.cloneDeep(connectionOptions)
          try {
            initiator.socket = await connect(options)
            setListener(initiator, async msg => {
              const message = JSON.parse(msg)
              const signal = message.signal
              expect(signal).toBe(signals.initiated)
              done()
            })
          } catch (e) {
            throw new Error('Failed to connect with valid connection options')
          }
        })
      })

       /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Initiator → Server] -> FAIL (ROUND 2)
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not be able to connect twice with the same credentials', async done => {
          let options = _.cloneDeep(connectionOptions)
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with same credentials twice')
          } catch (e) {
            done()
          }
        })
      })
    })

    /*
    ===================================================================================
      1b. Pairing -> Initial Connection -> Connect [Receiver → Server]
    ===================================================================================
    */
    describe('Connect [Receiver → Server]', () => {
      let connectionOptions

      beforeAll(() => {
        connectionOptions = {
          role: roles.receiver,
          connId: connId,
          signed: signed
        }
      })

      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not connect with missing @role property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.role
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with missing @role property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @role property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.role = 'invalid'
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with invalid @role property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.connId
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with missing @connId property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.connId = 'invalid'
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with invalid @connId property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with unmatched @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.connId = options.connId.slice(0, -10) + 'abcdeabcde' 
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with unmatched @connId property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @signed property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.signed
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with missing @signed property')
          } catch (e) {
            done()
          }
        })
        it('Should not connect with unmatched @signed property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.signed = randomstring.generate(32)
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with unmatched @signed property')
          } catch (e) {
            done()
          }
        })
      })

      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should initiate socket connection', async done => {
          let options = _.cloneDeep(connectionOptions)
          try {
            receiver.socket = await connect(options)

            let receiverPromise = new Promise((resolve, reject) => {
              setListener(receiver, async msg => {
                const message = JSON.parse(msg)
                const signal = message.signal
                expect(signal).toBe(signals.confirmation)
                resolve()
              })
            })

            let initiatorPromise = new Promise((resolve, reject) => {
              setListener(initiator, async msg => {
                const message = JSON.parse(msg)
                const signal = message.signal
                expect(signal).toBe(signals.confirmation)
                resolve()
              })
            })
            
            // Await promises from both receiver and initiator //
            await Promise.all([
              receiverPromise,
              initiatorPromise
            ])

            // Success //
            done()
          } catch (e) {
            throw new Error('Failed to connect with valid connection options')
          }
        })
      })

      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> FAIL (ROUND 2)
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not be able to connect twice with the same credentials', async done => {
          let options = _.cloneDeep(connectionOptions)
          try {
            receiver.socket = await connect(options)
            throw new Error('Connected with same credentials twice')
          } catch (e) {
            done()
          }
        })
      })
    })
  })

  /*
  ===================================================================================
    2. Pairing -> Offer Creation
  ===================================================================================
  */
  describe('Offer Creation', () => {
    /*
    ===================================================================================
      2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server]
    ===================================================================================
    */
    describe('OfferSignal [Initiator → Server]', () => {
      let encryptedData
      let offerPayload

      beforeAll(async done => {
        encryptedData = await CryptoUtils.encrypt(version, privateKey)
        offerPayload = {
          data: encryptedData,
          connId: connId,
          options: stunServers
        }
        done()
      })

      /**
       * Attempt to send an initiator "offersignal" to server with a given @payload.
       * Resolve on successful response, reject if error.
       */
      const attemptOffer = async (payload) => {
        return new Promise(async (resolve, reject) => {
          const message = JSON.stringify({
            action: 'offersignal',
            data: payload
          })
          try {
            await initiator.socket.send(message)
            setListener(receiver, async msg => {
              resolve(msg)
            })
          } catch (e) {
            reject(e)
          }
        })
      }

      /**
       * Attempts to establish an initiator webRTC connection.
       * Resolve on success. Timeout/fail on error.
       */
      const connectInitiatorWebRTC = async () => {
        return new Promise((resolve, reject) => {
          // Add initiator property to default options //
          let webRTCOptions = {
            initiator: true,
            ...defaultWebRTCOptions
          }

          // Create initiator WebRTC peer //
          initiator.peer = new Peer(webRTCOptions)
          initiator.peer.on(rtcSignals.signal, data => {
            resolve(data)
          })
        })
      }

      /*
      ===================================================================================
        2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not succeed with missing @data property', async done => {
          let clonedPayload = _.cloneDeep(offerPayload)
          delete clonedPayload.data
          attemptOffer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with missing @data property') })
            .catch(done)
          pass(done)
        })
        it('Should not succeed with invalid @data property', async done => {
          let clonedPayload = _.cloneDeep(offerPayload)
          clonedPayload.data = 'invalid'
          attemptOffer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with invalid @data property') })
            .catch(done)
          pass(done)
        })
        it('Should not succeed with missing @connId property', async done => {
          let clonedPayload = _.cloneDeep(offerPayload)
          delete clonedPayload.connId
          attemptOffer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with missing @connId property') })
            .catch(done)
          pass(done)
        })
        it('Should not succeed with invalid @connId property', async done => {
          let clonedPayload = _.cloneDeep(offerPayload)
          clonedPayload.connId = 'invalid'
          attemptOffer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with invalid @connId property') })
            .catch(done)
          pass(done)
        })
      })

      /*
      ===================================================================================
        2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should send an offer and server list to the SignalServer for retransmission to the receiver', async done => {

          const webRTCDetails = await connectInitiatorWebRTC()
          
          // Send WebRTC offer as encrypted string //
          const encryptedSend = await CryptoUtils.encrypt(
            JSON.stringify(webRTCDetails),
            privateKey
          )

          // Set payload data //
          let clonedPayload = _.cloneDeep(offerPayload)
          clonedPayload.data = encryptedSend

          // Emit offer signal for receiver and check properties //
          try {
            const offerResponse = await attemptOffer(clonedPayload)
            const offerMessage = JSON.parse(offerResponse)
            const signal = offerMessage.signal
            const data = offerMessage.data
            const offer = data.data
            const decryptedOffer = await CryptoUtils.decrypt(
              offer,
              privateKey
            )
            const expectedVersionProperties = ['type', 'sdp']

            receiver.offer = JSON.parse(decryptedOffer)

            expect(signal).toBe(signals.offer)
            expect(Object.keys(receiver.offer)).toEqual(
              expect.arrayContaining(expectedVersionProperties)
            )

            done()
          } catch (e) {
            throw new Error('Failed to send offerSignal')
          }
        })
      })
    })
  })

  /*
  ===================================================================================
    3. Pairing -> Answer Creation
  ===================================================================================
  */
  describe('Answer Creation', () => {
    const webRTCOptions = {
      ...defaultWebRTCOptions
    }

    /*
    ===================================================================================
      3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server]
    ===================================================================================
    */
    describe('AnswerSignal [Receiver → Server]', () => {
      let encryptedData
      let answerPayload

      beforeAll(async done => {
        encryptedData = await CryptoUtils.encrypt(version, privateKey)
        answerPayload = {
          data: encryptedData,
          connId: connId
        }
        done()
      })

      /**
       * Attempt to send a receiver "answersignal" to server with a given @payload.
       * Resolve on successful response, reject if error.
       */
      const attemptAnswer = async (payload) => {
        return new Promise(async (resolve, reject) => {
          const message = JSON.stringify({
            action: 'answersignal',
            data: payload
          })
          try {
            await receiver.socket.send(message)
            setListener(initiator, async msg => {
              resolve(msg)
            })
          } catch (e) {
            reject(e)
          }
        })
      }

      /**
       * Attempts to establish a receiver webRTC connection using offer data sent by initiator.
       * Resolve on success. Timeout/fail on error.
       */
      const connectReceiverWebRTC = async () => {
        return new Promise((resolve, reject) => {
          receiver.peer = new Peer(webRTCOptions)
          receiver.peer.signal(receiver.offer)
          receiver.peer.on(rtcSignals.signal, data => {
            resolve(data)
          })
        })
      }

      /*
      ===================================================================================
        3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not connect with missing @data property', async done => {
          let clonedPayload = _.cloneDeep(answerPayload)
          delete clonedPayload.data
          attemptAnswer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with missing @data property') })
            .catch(done)
          pass(done)
        })
        it('Should not connect with invalid @data property', async done => {
          let clonedPayload = _.cloneDeep(answerPayload)
          clonedPayload.data = 'invalid'
          attemptAnswer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with invalid @data property') })
            .catch(done)
          pass(done)
        })
        it('Should not connect with missing @connId property', async done => {
          let clonedPayload = _.cloneDeep(answerPayload)
          delete clonedPayload.connId
          attemptAnswer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with missing @connId property') })
            .catch(done)
          pass(done)
        })
        it('Should not connect with invalid @connId property', async done => {
          let clonedPayload = _.cloneDeep(answerPayload)
          clonedPayload.connId = 'invalid'
          attemptAnswer(clonedPayload)
            .then(()=> { throw new Error('Succeeded with invalid @connId property') })
            .catch(done)
          pass(done)
        })
      })

      /*
      ===================================================================================
        3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should transmit an answer to the received offer for retransmission to the initiator', async done => {
          
          const webRTCDetails = await connectReceiverWebRTC()

          // Send WebRTC answer as encrypted string //
          const encryptedSend = await CryptoUtils.encrypt(
            JSON.stringify(webRTCDetails),
            privateKey
          )

          // Set payload data //
          let clonedPayload = _.cloneDeep(answerPayload)
          clonedPayload.data = encryptedSend

          // Emit offer signal for receiver and check properties //
          try {
            const answerResponse = await attemptAnswer(clonedPayload)
            const answerMessage = JSON.parse(answerResponse)
            const signal = answerMessage.signal
            const data = answerMessage.data
            const answer = data.data
            const decryptedAnswer = await CryptoUtils.decrypt(
              answer,
              privateKey
            )
            const expectedVersionProperties = ['type', 'sdp']

            initiator.answer = JSON.parse(decryptedAnswer)

            expect(signal).toBe(signals.answer)
            expect(Object.keys(initiator.answer)).toEqual(
              expect.arrayContaining(expectedVersionProperties)
            )

            done()
          } catch (e) {
            throw new Error('Failed to send answer')
          }
        })
      })
    })
  })
})