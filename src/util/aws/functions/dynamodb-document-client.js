'use strict'

import _ from 'lodash'
import AWS from 'aws-sdk'

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })
const { TABLE_NAME } = process.env

export default (() => {
  /**
   * Abstracted DynamoDBDocumentClient get() request.
   *
   * @param  {Object} params - Key{key: value, ...}
   * @return {Object} - DynamoDB Document
   */
  const get = async params => {
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
  const put = async params => {
    const putParams = {
      TableName: TABLE_NAME,
      Item: params
    }
    return await ddb.put(putParams).promise()
  }

  /**
   * Abstracted DynamoDBDocumentClient query() request
   *
   * @param  {Object} params - Item{key: value, ...}
   * @return {Object} - DynamoDB Document
   */
  const query = async params => {
    const queryParams = _.merge({ TableName: TABLE_NAME }, params)
    return await ddb.query(queryParams).promise()
  }

  /**
   * Abstracted DynamoDBDocumentClient delete() request
   *
   * @param  {Object} params - Item{key: value}
   */
  const del = async params => {
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: params
    }
    return await ddb.delete(deleteParams).promise()
  }

  return {
    get,
    put,
    query,
    delete: del
  }
})()
