'use strict'

import dynamoDocumentClient from '@util/aws/functions/dynamodb-document-client'

export default (() => {
  
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
    byConnId
  }
})()