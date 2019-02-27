'use strict'

// Imports //


// Lib //
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
  }

  /*
  ===================================================================================
    Setters
  ===================================================================================
  */
 
  set publicKey (val) {
    this.publicKey = val
  }

  set privateKey (val) {
    this.privateKey = val
  }

  set signed (val) {
    this.signed = val
  }

  set connId (val) {
    this.connId = val
  }

  /*
  ===================================================================================
    Websocket
  ===================================================================================
  */

  async connect (websocketURL, connId, signed) {
    await this.socket.connect(
      websocketURL, 
      {
        role: roles.initiator,
        connId: connId,
        signed: signed
      }
    )
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
    return await this.peer.offer()
  }
  
}