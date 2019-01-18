'use strict'

import _ from 'lodash'
import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })
const { TABLE_NAME } = process.env

export default (() => {
  /**
   * Abstracted DynamoDBDocumentClient get() request.
   * 
   * @param  {Object} params - Key{key: value}
   * @return {Object} - DynamoDB Document
   */
  const get = async (params) => {
    const getParams = {
      TableName: TABLE_NAME,
      Key: params
    }
    return await ddb.get(getParams).promise()
  }

  /**
   * Abstracted DynamoDBDocumentClient put() request
   * 
   * @param  {Object} params - Item{key: value, ...}
   * @return {Object} - DynamoDB Document
   */
  const put = async (params) => {
    const putParams = {
      TableName: TABLE_NAME,
      Item: params
    }
    return await ddb.put(putParams).promise()
  }

  const query = async (params) => {
    const queryParams = _.merge({TableName: TABLE_NAME}, params)
    return await ddb.query(queryParams).promise()
  }

  return {
    get,
    put,
    query
  }
})()