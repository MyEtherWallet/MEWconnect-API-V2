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
    this.listeners = {}
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

  connect (answer) {
    this.peer.signal(answer)
  }

  on (signal, fn) {
    this.peer.on(signal, fn)
  }
  
}