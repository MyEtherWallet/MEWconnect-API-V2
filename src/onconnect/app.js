'use strict'

import AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })
const DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' })

const handler = async (event, context, callback) => {
  let query = event.queryStringParameters

  let role = query.role
  let connId = query.connId

  if(role !== 'initiator' || role !== 'receiver') {
    return callback(null, {
      statusCode: 500,
      body: 'Failed to connect: Invalid role'
    })
  }

  const putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: { 
        S: event.requestContext.connectionId 
      },
      // connId: { 
      //   S: connId
      // }
    }
  }

  DDB.putItem(putParams, err => {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? `Failed to connect: ${JSON.stringify(err)}` : 'Connected'
    })
  })
}

export { handler }
