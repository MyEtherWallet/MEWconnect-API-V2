'use strict'

import wrtc from 'wrtc'

const stunServers = [{ urls: process.env.STUN_SERVER }]
const websocketURL = process.env.WEBSOCKET_URL
const webRTCOptions = {
  trickle: false,
  iceTransportPolicy: 'relay',
  config: {
    iceServers: stunServers
  },
  wrtc: wrtc
}

export { stunServers, websocketURL, webRTCOptions }
