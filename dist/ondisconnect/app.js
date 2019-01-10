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

var handler = function handler(event, context, callback) {
  var deleteParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: { S: event.requestContext.connectionId }
    }
  };

  DDB.deleteItem(deleteParams, function (err) {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? 'Failed to disconnect: ' + JSON.stringify(err) : 'Disconnected'
    });
  });
};

exports.handler = handler;