'use strict'

import Peer from 'simple-peer'
import { stunServers, webRTCOptions } from '@config'
import { rtcSignals } from '@signals'

export default class WebRTCConnection {

  constructor (options = {}) {
    this.options = options
    this.peer = {}
    this.listeners = {}
  }

  /**
   * Attempt to initiate an "offer" WebRTC connection between two peers.
   * This will return an offer object that can be used by the receiver to create a
   * p2p connection.
   *
   * @return {Object} - WebRTC connection offer
   */
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

  /**
   * Given a WebRTC offer object (created with the offer() function),
   * a receiver can create a WebRTC response in order to create a p2p
   * connection between the initiator and receiver.
   *
   * @param  {Object} offer - WebRTC offer object create with offer()
   * @return {Object} - WebRTC answer object, to be used by the initiator
   */
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

  /**
   * Given a WebRTC answer object, complete WebRTC connection.
   * @param  {Object} answer - WebRTC answer object created by answer()
   */
  connect (answer) {
    this.peer.signal(answer)
  }

  /**
   * On @sigal event sent via WebRTC, perform given fn
   * @param  {String} signal - WebRTC signal/event. E.g. 'data'
   * @param  {Function} fn - Callback function to perform on signal event
   */
  on (signal, fn) {
    this.peer.on(signal, fn)
  }
  
}