'use strict'

import AWS from 'aws-sdk'
import test from '@util/test'

AWS.config.update({ region: process.env.AWS_REGION })
const DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' })

const handler = (event, context, callback) => {
  const putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: { 
        S: event.requestContext.connectionId 
      }
    }
  }

  console.log('randomstring: ', test())
  
  DDB.putItem(putParams, err => {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? `Failed to connect: ${JSON.stringify(err)}` : 'Connected'
    })
  })
}

export { handler }