var persistence = require("./persistence");

var apiPath = "/api";

var getRoutes = [
	{
		url: "/player",
		handler: function (req, res) {
			persistence.fetch("player", [], function(result) {
				res.send(result);
			});
		}
	},
	{
		url: "/game",
		handler: function (req, res) {
			persistence.fetch("game", [], function(result) {
				res.send(result);
			});
		}
	},
	{
		url: "/track",
		handler: function (req, res) {
			persistence.fetch("track", [], function(result) {
				res.send(result);
			});
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			persistence.fetch("car", [], function(result) {
				res.send(result);
			});
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			persistence.fetch("record", [], function(result) {
				res.send(result);
			});
		}
	},
];

var postRoutes = [
	{
		url: "/player",
		handler: function (req, res) {
			console.log("Adding player");
			persistence.insert("player", req.body.player, function(status, something) {
				res.status(status).send("Added player");
			});
		}
	},
	{
		url: "/game",
		handler: function (req, res) {
			console.log("Adding game");
			persistence.insert("game", req.body.game, function(status, something) {
				res.status(status).send("Added game");
			});
		}
	},
	{
		url: "/track",
		handler: function (req, res) {
			console.log("Adding track");
			persistence.insert("track", req.body.track, function(status, something) {
				res.status(status).send("Added track");
			});
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			console.log("Adding car");
			persistence.insert("car", req.body.car, function(status, something) {
				res.status(status).send("Added car");
			});
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			console.log("Adding record");
			res.status(200).send("TODO");
			//persistence.insert("record", req.body.record, function(status, something) {
			//});
		}
	}
];

module.exports = {
	apiPath: apiPath,
	getRoutes: getRoutes,
	postRoutes: postRoutes
};