'use strict'

// Imports //
import _ from 'lodash'
import Peer from 'simple-peer'
import queryString from 'query-string'
import WebSocketClient from 'promise-ws'
import wrtc from 'wrtc'

// Libs //
import CryptoUtils from '@utils/crypto-utils'
import { signals, roles } from '@signals'

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
  answer: {}
}

// Receiver Object //
let receiver = {
  socket: {},
  version: {},
  peer: {},
  offer: {}
}

/*
===================================================================================
  Test "Member Functions"
===================================================================================
*/

/**
 * Connect to a given WebSocket @url
 * 
 * @param  {String} url - WSS connection URL
 * @return {Object} WebSocket Connection object
 */
const connect = async (options = {}) => {
  let url = `${websocketURL}${queryString.stringify(options)}`
  let connection = await WebSocketClient.create(url)
  return connection
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

  /*
  ===================================================================================
    2a. Pairing -> Initial Connection
  ===================================================================================
  */
  describe('Initial Connection', () => {
    /*
    ===================================================================================
      2a-1. Pairing -> Initial Connection -> Connect [Server → Initiator]
    ===================================================================================
    */
    describe('Connect [Initiator → Server]', () => {
      let message
      let connectionOptions

      beforeAll(() => {
        message = CryptoUtils.generateRandomMessage()
        connectionOptions = {
          role: roles.initiator,
          connId: connId,
          signed: signed
        }
      })

      /*
      ===================================================================================
        2a-1. Pairing -> Initial Connection -> Connect [Server → Initiator] -> FAIL
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
            pass(done)
          }
        })
        it('Should not connect with invalid @role property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.role = 'invalid'
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with invalid @role property')
          } catch (e) {
            pass(done)
          }
        })
        it('Should not connect with missing @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.connId
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with missing @connId property')
          } catch (e) {
            pass(done)
          }
        })
        it('Should not connect with invalid @connId property', async done => {
          let options = _.cloneDeep(connectionOptions)
          options.connId = 'invalid'
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with invalid @connId property')
          } catch (e) {
            pass(done)
          }
        })
        it('Should not connect with missing @signed property', async done => {
          let options = _.cloneDeep(connectionOptions)
          delete options.signed
          try {
            initiator.socket = await connect(options)
            throw new Error('Connected with missing @signed property')
          } catch (e) {
            pass(done)
          }
        })
      })

      /*
      ===================================================================================
        2a-1. Pairing -> Initial Connection -> Connect [Server → Initiator] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should initiate socket connection', async done => {
          let options = _.cloneDeep(connectionOptions)
          try {
            initiator.socket = await connect(options)
            done()
          } catch (e) {
            throw new Error('Failed to connect with valid connection options')
          }
        })
      })
    })
  })
})