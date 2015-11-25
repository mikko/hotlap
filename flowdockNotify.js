var request = require("request");
var Promise = require("bluebird");
var fs = require("fs");

var apiToken;

try{
	apiToken = fs.readFileSync("apiToken.conf").toString();
}
catch(e) {
	console.log("API token for flowdock not found");
}

module.exports = {
	send: function(subject, message) {
		if (!apiToken) {
			return Promise.reject("No api token configured");
		}
		var options = { 
			url: "https://api.flowdock.com/v1/messages/team_inbox/" + apiToken,
		  	method: "POST",
		  	json: { 
	   			source: "Laptimes",
				from_address: "noreply@nowhere.wut",
				subject: subject,
				content: message 
			} 
		}
		return new Promise((resolve, reject) => {
			request(options, (err, response, body) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(response);
				}
			});
		});
	},
	template: require("fs").readFileSync("./template/newRecord.template")
};