# MewConnect Pairing Server

The MewConnect Pairing Server attempts to pair two "signaling" peers together via a secure AWS Lambda Websocket connection.
These peers will then establish a webRTC connection to each other, allowing secure communication using the credentials created during the pairing process.

# Setup

It is a required that you have [node.js](https://nodejs.org/en/), [Docker](https://www.docker.com/), and [Docker Compose](https://docs.docker.com/compose/) installed on your system.

## .env

Before installing, it is required that you create a .env file with the following variables obtained via your AWS account:

```
AWSCLI_VERSION=1.16.112
AWS_DEFAULT_REGION=us-west-1
AWS_ACCESS_KEY_ID=###################
AWS_SECRET_ACCESS_KEY=################################
AWS_REGION=us-west-1
TABLE_NAME=simple-chat-table-name
S3_BUCKET=simple-chat-bucket-name
```

## Install

```
npm install
```

## Test

```
npm run test
```

# Deploying to AWS

```
npm run deploy
```

# Interaction

Interaction with the v2 API is largely the same as v1, however there are some immediate differences:

## Sending Messages

Messages must be stringified JSON objects in the following format:

```
{
  action: signal, // E.G signals.offerSignal => 'offersignal'
  data: message
}
```

Please note that signals must now be lowercase.
What was previously "offerSignal" must now be "offersignal".

## Receiving Messages

The WebSocket client should listen for an on "message" event.
The message that is received will be a stringified JSON object.

```
{
  WebsocketClient.on('message', message => {
    // Handle message payload
  })
}
```

The "signals" will be relayed in the message payload:

```
{
  signal: signal, // E.G. signals.confirmation => 'confirmation'
  data: data, // Actual data/message layload
  message: message // Server response explanation. E.G. 'Initiator sent WebRTC Offer. Please respond.'
}
```

### Flow

### Initial Connection

When initially connecting, proper query params must be appended to the URL.
The process to connect to the same connId is much quicker, and only involves one step:

```
role = 'initiator' or 'receiver'
connId
signed
```

```
Initiator.connect('wss://22jmo882mb.execute-api.us-west-1.amazonaws.com/dev?role=initiator&connId=<connId>&signed=<signed>')
Receiver.connect('wss://22jmo882mb.execute-api.us-west-1.amazonaws.com/dev?role=receiver&connId=<connId>&signed=<signed>')
```