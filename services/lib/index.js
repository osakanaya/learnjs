var http = require('http');
var AWS = require('aws-sdk');

AWS.config.region = 'ap-northeast-1';

var config = {
	dynamoTableName: 'learnjs',
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient();

function reduceItems(memo, items) {
	items.forEach(function(item) {
		memo[item.answer] = (memo[item.answer] || 0) + 1;
	});
	
	return memo;
}

function byCount(e1, e2) {
	return e2[0] - e1[0];
}

function filterItems(items) {
	var values = [];
	for(var i in items) {
		values.push([items[i], i]);
	}
	
	var topFive = {};
	values.sort(byCount).slice(0, 5).forEach(function(e) {
		topFive[e[1]] = e[0];
	});
	
	return topFive;
}

function getAnswers(problemNumber) {
	return new Promise(function(resolve, reject) {
		var result = [];
		var params = {
			FilterExpression: 'problemId = :problemId',
			ExpressionAttributeValues: {
				':problemId': json.problemNumber,
			},
			TableName: config.dynamoTableName,
		};
		
		var loop = function(startKey) {
			if (typeof startKey !== 'undefined') {
				params.ExclusiveStartKey = startKey;
			}
			
			exports.dynamodb.scan(params).promise()
			.then(function(data) {
				data.Items.forEach(function(item) {
					result.push(item);
				});
				
				if (typeof data.LastEvaluatedKey !== 'undefined') {
					loop(data.LastEvaluatedKey);
				} else {
					resovle(result);
				}
			})
			.catch(reject);
		};
		
		loop();
	});
}

exports.popularAnswers = function(json, context) {
	getAnswers()
	.then(function(items) {
		context.succeed(filterItems(reduceItems({}, items)));
	})
	.catch(function(err) {
		context.fail(err);
	});
};

exports.echo = function(json, context) {  
  context.succeed(["Hello from the cloud! You sent " + JSON.stringify(json)]);
};
