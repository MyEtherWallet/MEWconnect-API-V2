'use strict'

import CryptoUtils from '@utils/crypto-utils'
import WebsocketConnection from '@utils/websocket-connection'
import WebRTCConnection from '@utils/webrtc-connection'
import { stunServers, version, websocketURL, webRTCOptions } from '@config'
import { signals, rtcSignals, roles } from '@signals'

export default class Initiator {

  constructor (options = {}) {
    this.socket = new WebsocketConnection()
    this.peer = new WebRTCConnection()

    this.publicKey
    this.privateKey
    this.signed
    this.connId

    this.webRTCAnswer
  }

  /*
  ===================================================================================
    Keys
  ===================================================================================
  */
 
  generateKeys () {
    const keys = CryptoUtils.generateKeys()
    this.publicKey = keys.publicKey
    this.privateKey = keys.privateKey
    this.connId = CryptoUtils.generateConnId(this.publicKey)
    this.signed = CryptoUtils.signMessage(this.privateKey, this.privateKey)
  }

  /*
  ===================================================================================
    Encryption
  ===================================================================================
  */
  
  async encrypt (message) {
    message = typeof message === 'String' ? message : JSON.stringify(message)
    return await CryptoUtils.encrypt(message, this.privateKey)
  }
 
  async decrypt (message) {
    const decryptedMessageString = await CryptoUtils.decrypt(message, this.privateKey)
    return JSON.parse(decryptedMessageString)
  }

  /*
  ===================================================================================
    Websocket
  ===================================================================================
  */

  async connect (websocketURL, options = null) {
    const queryOptions = options ? options : {
      role: roles.initiator,
      connId: this.connId,
      signed: this.signed
    }
    await this.socket.connect(websocketURL, queryOptions)
  }

  on (signal, fn) {
    this.socket.on(signal, fn)
  }

  off (signal) {
    this.socket.off(signal)
  }

  send (signal, data) {
    this.socket.send(signal, data)
  }

  /*
  ===================================================================================
    WebRTC
  ===================================================================================
  */
 
  async offer () {
    const offer = await this.peer.offer()
    return await this.encrypt(offer)
  }

  async signal (answer) {
    return await this.peer.connect(answer)
  }

  onRTC (signal, fn) {
    this.peer.on(signal, fn)
  }
  
}