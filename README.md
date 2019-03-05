# MewConnect Pairing Server

The MewConnect Pairing Server attempts to pair two "signaling" peers together via a secure AWS Lambda Websocket connection.
These peers will then establish a WebRTC connection to each other, allowing secure communication using the credentials created during the pairing process.

# Setup

It is a required that you have [node.js](https://nodejs.org/en/), [Docker](https://www.docker.com/), and [Docker Compose](https://docs.docker.com/compose/) installed on your system.

## .env

Before installing, it is required that you create a .env file with the following variables obtained via your AWS and Twilio accounts:

```
# AWS Info and Credentials
AWSCLI_VERSION=1.16.112
AWS_DEFAULT_REGION=us-west-1
AWS_ACCESS_KEY_ID=****************************
AWS_SECRET_ACCESS_KEY=****************************
AWS_REGION=us-west-1
TABLE_NAME=signal-server-table
S3_BUCKET=signal-server-bucket

# Twilio Credentials (For TURN server)
TWILIO_ID=****************************
TWILIO_TOKEN=****************************
TWILIO_TTL=3600
```

## Install

```
npm install
```

# Test

Testing requires a proper `.env.test` file to be in the root directory.

```
WEBSOCKET_URL=wss://**********.execute-api.us-west-1.amazonaws.com/dev
STUN_SERVER=stun:global.stun.twilio.com:3478?transport=udp
```

```
npm run test
```

# Deploying to AWS

```
npm run deploy
```