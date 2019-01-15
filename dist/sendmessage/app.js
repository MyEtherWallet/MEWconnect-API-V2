'use strict';

// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

var AWS = require('aws-sdk');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
var DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

var TABLE_NAME = process.env.TABLE_NAME;


exports.handler = async function (event, context) {
  var connectionData = void 0;

  console.log('conn', event.requestContext.connectionId);

  try {
    connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  var apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  var postData = JSON.parse(event.body).data;

  var postCalls = connectionData.Items.map(async function (_ref) {
    var connectionId = _ref.connectionId;

    try {
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log('Found stale connection, deleting ' + connectionId);
        var a = await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId: connectionId } }).promise();
        console.log('aaaaa', a);
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};