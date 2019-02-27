'use strict'

// Imports //
import Peer from 'simple-peer'

// Lib //
import { stunServers, webRTCOptions } from '@config'
import { rtcSignals } from '@signals'

export default class WebRTCConnection {

  constructor (options = {}) {
    this.options = options
    this.peer = {}
  }

  async offer () {
    return new Promise((resolve, reject) => {
      const options = {
        initiator: true,
        ...webRTCOptions
      }
      this.peer = new Peer(options)
      this.peer.on(rtcSignals.signal, data => {
        resolve(data)
      })
    })
  }

  async answer (offer) {
    return new Promise((resolve, reject) => {
      const options = webRTCOptions
      this.peer = new Peer(options)
      this.peer.signal(offer)
      this.peer.on(rtcSignals.signal, data => {
        resolve(data)
      })
    })
  }
  
}