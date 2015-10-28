var persistence = require("./persistence");

var apiPath = "/api";

var getRoutes = [
	{
		url: "/player",
		handler: function (req, res) {
			persistence.test(function(result) {
				res.send("player");
			});
		}
	},
	{
		url: "/game",
		handler: function (req, res) {
			persistence.test(function(result) {
				res.send("game");
			});
		}
	},
	{
		url: "/track",
		handler: function (req, res) {
			persistence.test(function(result) {
				res.send("track");
			});
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			persistence.test(function(result) {
				res.send("car");
			});
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			persistence.test(function(result) {
				res.send("record");
			});
		}
	},
];

var postRoutes = [
	{
		url: "/player",
		handler: function (req, res) {
			console.log("Adding player");
			console.log(JSON.stringify(req.body));
			res.status(200).send("Added player");
		}
	},
	{
		url: "/game",
		handler: function (req, res) {
			console.log("Adding game");
			console.log(JSON.stringify(req.body));
			res.status(200).send("Added game");
		}
	},
	{
		url: "/track",
		handler: function (req, res) {
			console.log("Adding track");
			console.log(JSON.stringify(req.body));
			res.status(200).send("Added track");
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			console.log("Adding car");
			console.log(JSON.stringify(req.body));
			res.status(200).send("Added car");
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			console.log("Adding record");
			console.log(JSON.stringify(req.body));
			res.status(200).send("Added record");
		}
	}
];

module.exports = {
	apiPath: apiPath,
	getRoutes: getRoutes,
	postRoutes: postRoutes
};