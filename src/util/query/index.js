'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'

export default (() => {

  const byConnectionId = async (connectionId) => {
    const getParams = {
      connectionId: connectionId
    }
    try {
      let entry = await dynamoDocumentClient.get(getParams)
      return entry.Item
    } catch (e) {
      return null
    }
  }
  
  /**
   * Perform a query "by @connId" and return the results.
   * 
   * @param  {String} connId - A @connId string
   * @return {Object} - DynamoDB query results
   */
  const byConnId = async (connId) => {
  	const queryParams = {
	    IndexName: 'connIdIndex',
	    KeyConditionExpression: '#connId = :conn_id',
	    ExpressionAttributeNames:{
	        "#connId": "connId"
	    },
	    ExpressionAttributeValues: {
	        ":conn_id": connId
	    }
	  }
    try {
      let entries = await dynamoDocumentClient.query(queryParams)
      return entries.Items
    } catch (e) {
      return []
    }
  }

  return {
    byConnectionId,
    byConnId
  }
})()