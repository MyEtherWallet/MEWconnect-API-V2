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
  console.log('table', process.env.TABLE_NAME);
  var putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: {
        S: event.requestContext.connectionId
      }
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