'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = undefined;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_awsSdk2.default.config.update({ region: process.env.AWS_REGION });
var DDB = new _awsSdk2.default.DynamoDB({ apiVersion: '2012-10-08' });

var handler = async function handler(event, context, callback) {
  var query = event.queryStringParameters;

  var role = query.role;
  var connId = query.connId;

  if (role !== 'initiator' || role !== 'receiver') {
    return callback(null, {
      statusCode: 500,
      body: 'Failed to connect: Invalid role'
    });
  }

  var putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: {
        S: event.requestContext.connectionId
      }
      // connId: { 
      //   S: connId
      // }
    }
  };

  DDB.putItem(putParams, function (err) {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? 'Failed to connect: ' + JSON.stringify(err) : 'Connected'
    });
  });
};

exports.handler = handler;