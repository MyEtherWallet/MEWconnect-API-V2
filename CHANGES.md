# MEWConnect AWS Implementation

The MEWConnect Pairing Server attempts to pair two "signaling" peers together via a secure socket connection, by way of AWS Lambda Websockets.

These peers will then establish a WebRTC connection to each other, allowing secure communication using the credentials created during the pairing process.

This is V2 of the original MEWConnect Pairing server, having been refactored for deployment on AWS Lambda Websockets. It mostly follows the guidelines/spec of the [Original Document](https://docs.google.com/document/d/19acrYB3iLT4j9JDg0xGcccLXFenqfSlNiKVpXOdLL6Y), but the changes and general flow are outlined below.

## Message Format

Message formatting is different than the previous version of MEWConnect Pairing. The changes are documented below.

### Incoming Messages 

After successful connection to the MEWConnect Websocket endpoint, the socket connection should listen to the on "message" event. All incoming messages will be channeled through the "message" event, and the "signal" for each message will be contained in the message payload.

It is important to note that the "message" payload is a stringified JSON object, that when parsed, will have the following format:

```
{
  signal, // The actual "signal"
  data,   // The data payload
  message // Accompanying server message
}
```

So to reiterate: unlike the functionality that a library like Socket.io provides, there is no native "binding" to specific signal events such as:

```
socket.on('offerSignal', data => {
  // Handle offerSignal data
})
```

Instead, a basic implementation would look like:

```
socket.on('message', msg => {
  const parsedMsg = JSON.parse(msg) // Parse stringified msg into JSON object
  const signal = parsedMsg.signal   // This is the actual "signal"
  const data = parseMsg.data        // The data payload

  if (signal === 'offerSignal') {
    // Handle offerSignal data
  } 
})
```

For a more robust implementation/wrapper library that allows for functionality that more closely resembles something like Socket.io, check out:

[This wrapper made for the test suite](https://github.com/MyEtherWallet/MEWconnect-API-V2/blob/master/test/utils/websocket-connection.js)

### Outgoing Messages

Outgoing messages must also follow a specific format. They must be stringified JSON objects with the following structure:

```
{
  action, // The action is the "signal" e.g. "offersignal" 
             (It must be keyed as "action")
  data    // The data payload to send
}
```

## Initial Connection

**Signals of Note:**

```
[Server] -> [Initiator] : "initiated"
[Server] -> [Initiator] : "confirmation"
[Server] -> [Receiver]  : "confirmation"
```

Previously, several steps were required after the initial connection for the "initiator" and "receiever" to be able to start sending/receiving messages to one another. This process has been simplified into one step wherein the connection url contains all of the required query parameters within the initial connection request.

The connection process now works as follows:

```
const websocketUrl = 'wss://0ec2scxqck.execute-api.us-west-1.amazonaws.com/dev'
const role =   // 'initiator' or 'receiever'
const connId = // Last 32 characters of the public key portion of the key-pair
                  created for the particular paired connection
const signed = // Private key signed with the private key created for the 
                  connection

const connectionString = 
  `${websocketUrl}?role=${role}&connId=${connId}&signed=${signed}`

const socket = await Websocket.connect(connectionString)
socket.on('message', msg => {
  // Handle message
})
```

On connection success, the initiator client should receieve a "message" (as explained above) with the "initiated" signal.

When both the initiator and receiever successfully connect, both clients should receieve the "confirmation" signal. The initiator can now make an "offer"

NOTE: ALL MESSAGES FROM THIS POINT FORWARD MUST BE ENCRYPTED/DECRYPTED.

## Offer Creation

**Signals of Note:**

```
[Initiator] -> [Server]   : "offersignal"
```

Now that both the initiator and receiver are connected on a unique and secure websocket connection, they will attempt to connect to eachother via a webRTC connection.

First, the initiator must initialize a WebRTC connection, and send the ENCRYPTED details to the receiver. 

The outgoing "signal" is "offersignal" (NO CAPS!). The data payload is the ENCRYPTED details.

A basic pseudo-example using [Simple-Peer](https://github.com/feross/simple-peer) and [Eccrypto](https://github.com/bitchan/eccrypto) works as follows:

```
const peer = new Peer({ initiator: true, ... })
peer.on('signal', data => {
  const stringifiedData = JSON.stringify(data)
  const encryptedData = eccrpyto.encrypt(stringifiedData)
  const payload = JSON.stringify({
    action: 'offersignal',
    data: encryptedData
  })

  socket.send(payload)
})

```

## Answer Creation

**Signals of Note:**

```
[Server]   -> [Receiver] : "offer"
[Receiver] -> [Server]   : "answersignal"
```

On successful transmission of the message, the receiver will a message with the signal "offer".

The receiver must decrypt this message, and attempt to "answer" the WebRTC connection details provided by the initiator. This will not start the WebRTC connection, but just provide the details to the initiator that the receiver is ready to connect.

A basic pseudo-example using [Simple-Peer](https://github.com/feross/simple-peer) and [Eccrypto](https://github.com/bitchan/eccrypto) works as follows (for the sake of simplicity, the example below behaves as if using [the wrapper made for the test suite](https://github.com/MyEtherWallet/MEWconnect-API-V2/blob/master/test/utils/websocket-connection.js):

```
const peer = new Peer({ ... })
socket.on('offer', data => {
  // Decrypt Offer //
  const encryptedOffer = data.data
  const decryptedOffer = eccrypto.decrypt(encryptedOffer)

  // Signal for answer details //
  peer.signal(decryptedOffer)
  peer.on('signal', data => {

    // Encrypt answer details and send payload //
    const stringifiedData = JSON.stringify(data)
    const encryptedData = eccrpyto.encrypt(stringifiedData)
    const payload = JSON.stringify({
      action: 'answersignal',
      data: encryptedData
    })

    socket.send(payload)
  })
})
```

## WebRTC Connection

**Signals of Note:**

```
[Server]    -> [Initiator] : "answer"
[Initiator] -> [Server]    : "rtcconnected"
[Receiver]  -> [Server]    : "rtcconnected"
```

After the receiver sends the WebRTC answer to the initiator, the initiator should receive the ENCRYPTED answer response in a message via the "answer" signal.

It is at this point that the initiator can confirm the connection, at which point both the initiator and receiver should sucessfully connect to eachother via WebRTC.

They should then signal the MEWConnect Pairing server that they have successfully connected, at which point the connection to the MEWConnect Server will terminate.

A basic pseudo-example using [Simple-Peer](https://github.com/feross/simple-peer) and [Eccrypto](https://github.com/bitchan/eccrypto) works as follows (for the sake of simplicity, the example below behaves as if using [the wrapper made for the test suite](https://github.com/MyEtherWallet/MEWconnect-API-V2/blob/master/test/utils/websocket-connection.js):

```
/**
 * Initiator
 */

socket.on('answer', data => {
  // Decrypt Answer //
  const encryptedAnswer = data.data
  const decryptedAnswer = eccrypto.decrypt(encryptedAnswer)

  // Signal to connect to receiver via details provided in data payload //
  peer.signal(decryptedAnswer)
  peer.on('connect', () => {
    // Successfully connected to receiver. Signal to pairing server //
    const payload = JSON.stringify({
      action: 'rtcconnected'
    })
    socket.send(payload)
  })
})

```

```
/**
 * Receiver
 */

peer.on('connect', () => {
  // Successfully connected to receiver. Signal to pairing server //
  const payload = JSON.stringify({
    action: 'rtcconnected'
  })
  socket.send(payload)
})

```

## WebRTC Connection - TURN SERVERS

**Signals of Note:**

```
[Initiator] -> [Server]    : "tryturn"
[Server]    -> [Initiator] : "turntoken"
[Server]    -> [Receiver]  : "attemptingturn"
```

If for some reason the initial WebRTC connection attempts fail, the peers can attempt to connect via WebRTC by means of TURN servers.

The initiator must signal to the pairing server to "tryturn". The pairing server will return a "turntoken" signal to the initiator in response, with a data payload of the TURN server details, as well as an "attemptingturn" signal to the receiver, letting it know that the initiator is attempting to use TURN servers for the connection.

After receiving the TURN server details, the initiator can begin the WebRTC pairing process again by using the process outlined in the "Offer Creation" section. The only difference is that now the details are provided by the TURN servers.

A basic pseudo-example can be found below:

```
/**
 * Initiator
 */

socket.send('tryturn')
socket.on('turntoken', data => {
  const iceServers = data.iceServers
  ...
  // Continue from "Offer Creation", but the Peer configuration
  // will contain the iceServer information
})

```

```
/**
 * Receiver
 */

socket.on('attemptingturn', () => {
  // The receiver knows to "abandon" the previous WebRTC connection attempt,
  // and prepare for the new TURN connection.
  // At this point, the receiver will be ready for "Answer Creation"
})
```