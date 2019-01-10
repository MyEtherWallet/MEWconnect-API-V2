# (Updated) Simple Websockets Chat App

This is an updated version of the [AWS Simple Websockets Chat App](https://github.com/aws-samples/simple-websockets-chat-app). The functionality remains the same, however, running and deploying the process has been dockerized and made much simpler.

# Setup

It is a required that you have [node.js](https://nodejs.org/en/), [Docker](https://www.docker.com/), and [Docker Compose](https://docs.docker.com/compose/) installed on your system.

## .env

Before installing, it is required that you create a .env file with the following variables obtained via your AWS account:

```
AWSCLI_VERSION=1.16.71
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

# Deploying to AWS

```
npm run deploy
```

