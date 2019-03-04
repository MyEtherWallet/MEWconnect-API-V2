'use strict'

import wrtc from 'wrtc'

const stunServers = [{ urls: process.env.STUN_SERVER }]
const turnServers = [{ urls:process.env.TURN_SERVER }]
const websocketURL = process.env.WEBSOCKET_URL
const webRTCOptions = {
  trickle: false,
  iceTransportPolicy: 'relay',
  config: {
    iceServers: stunServers
  },
  wrtc: wrtc
}
const webRTCOptionsTURN = {
  trickle: false,
  iceTransportPolicy: 'relay',
  config: {
    iceServers: turnServers
  },
  wrtc: wrtc
}

export { stunServers, turnServers, websocketURL, webRTCOptions, webRTCOptionsTURN }