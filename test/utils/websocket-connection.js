'use strict'

// Imports //
import queryString from 'query-string'
import webSocketClient from 'promise-ws'

export default class WebsocketConnection {

  constructor (options = {}) {
    this.options = options
    this.socket = {}
    this.listeners = {}
  }
  
  /**
   * Connect to a given WebSocket @url
   * 
   * @param  {Object} options - JSON-formatted connection query params
   * @return {Object} WebSocket Connection object
   */
  async connect (websocketUrl, options = {}) {
    let url = `${websocketUrl}?${queryString.stringify(options)}`
    this.socket = await webSocketClient.create(url)
    this.socket.on('message', this.onMessage.bind(this))
  }

  /**
   * Set an 'on message' listener function for a given role (initiator or receiver)
   * 
   * @param  {String} signal - The signal to listen for
   * @param  {Function} fn - Function to perform on message signal
   */
  on (signal, fn) {
    this.listeners[signal] = fn
  }

  off (signal) {
    delete this.listeners[signal]
  }

  onMessage (message) {
    const parsedMessage = JSON.parse(message)
    const signal = parsedMessage.signal
    const data = parsedMessage.data

    try {
      this.listeners[signal].call(this, data)
    } catch (e) {
      // Unhandled message
    }
  }

  send (signal, data) {
    const message = JSON.stringify({
      action: signal,
      data: data
    })
    this.socket.send(message)
  }

}