'use strict'

import AWS from 'aws-sdk'
import { signals } from '@util/signals'

AWS.config.update({ region: process.env.AWS_REGION })
const DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' })

const handler = (event, context, callback) => {
  var deleteParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: { S: event.requestContext.connectionId }
    }
  }

  DDB.deleteItem(deleteParams, err => {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? `Failed to disconnect: ${JSON.stringify(err)}` : 'Disconnected'
    })
  })
}

export { handler }
