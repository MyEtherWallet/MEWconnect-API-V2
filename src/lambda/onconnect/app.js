'use strict'

import AWS from 'aws-sdk'
import Test from '@util/test'
// import crypto from 'crypto'

AWS.config.update({ region: process.env.AWS_REGION })
const DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' })

const handler = async (event, context, callback) => {
  // let query = event.queryStringParameters

  // let role = query.role
  // let connId = query.connId

  // if(role !== 'initiator' || role !== 'receiver') {
  //   return callback(null, {
  //     statusCode: 500,
  //     body: 'Failed to connect: Invalid role'
  //   })
  // }
  // 
  console.log(Test())

  const putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: { 
        S: event.requestContext.connectionId 
      },
      connId: { 
        S: 'test'
      }
    }
  }

  DDB.putItem(putParams, err => {
    if(err) console.log('err', err)
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? `Failed to connect: ${JSON.stringify(err)}` : 'Connected'
    })
  })
}

export { handler }
