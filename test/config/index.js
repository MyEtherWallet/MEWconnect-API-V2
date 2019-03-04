'use strict'

import wrtc from 'wrtc'

const stunServers = [{ urls: 'stun:global.stun.twilio.com:3478?transport=udp' }]
const version = '0.0.1'
const websocketURL = 'wss://22jmo882mb.execute-api.us-west-1.amazonaws.com/dev'
const webRTCOptions = {
  trickle: false,
  iceTransportPolicy: 'relay',
  config: {
    iceServers: stunServers
  },
  wrtc: wrtc
}

export { stunServers, version, websocketURL, webRTCOptions }