var persistence = require("./persistence");
var Promise = require("bluebird");

var apiPath = "/v1";

var getRoutes = [
	{
		url: "/contest",
		handler: function(req, res) {
			// Get related games
			var getGames = function(gameIds) {
				
				return {};
			}
			// Get related tracks
			var getTracks = function(trackIds) {
				return {};
			}
			// Get related cars
			var getCars = function(carIds) {
				return {};
			}

			// Get list of contests
			var parseContests = function(data) {
				var games = [];
				var tracks = [];
				var cars = [];
				data.contests.forEach(contest => {
					games.push(contest.game);
					tracks.push(contest.track);
					cars.push(contest.car);
				});
				res.send(JSON.stringify({games: games, tracks: tracks, cars: cars}));
			}
			var contests = persistence.fetchAll("contest")
				.then(parseContests);
		}
	},
	{
		url: "/contest/:id",
		handler: function(req, res) {
			// Get contest data

			// Get related game

			// Get related data.track

			// Get related car

			// Get related records

			
			res.send("TODO");
		}
	},
	{
		url: "/:entity",
		handler: function (req, res) {
			persistence.fetchAll(req.params.entity)
				.then(function(result) {
					res.send(result);
				});
		}
	},
	{
		url: "/:entity/:id",
		handler: function (req, res) {
			persistence.fetch(req.params.entity, req.params.id)
				.then(function(result) {
					res.send(result);
				});
		}
	},
	{
		url: "/:entity/:id/full",
		handler: function (req, res) {
			persistence.fetchFull(req.params.entity, req.params.id)
				.then(function(result) {
					res.send(result);
				});
		}
	}
];

var postRoutes = [
	{
		url: "/player",
		handler: function (req, res) {
			console.log("Adding player");
			persistence.insert("player", req.body.player)
				.then(function(status, something) {
					res.status(status ? 200 : 418).send("Added player");
				});
		}
	},
	{
		url: "/game",
		handler: function (req, res) {
			console.log("Adding game");
			persistence.insert("game", req.body.game)
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added game");
				});
		}
	},
	{
		url: "/track",
		handler: function (req, res) {
			console.log("Adding track");
			persistence.insert("track", req.body.track)
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added track");
				});
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			console.log("Adding car");
			persistence.insert("car", req.body.car)
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added car");
				});
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			console.log("Adding record");
			var params = [
				req.body.time,
				req.body.gameid,
				req.body.playerid,
				req.body.trackid,
				req.body.carid
			]
			persistence.insert("record", params)
				.then(function(status, something) {
					console.log("Record inserted", JSON.stringify(params));
				});
		}
	}
];

module.exports = {
	apiPath: apiPath,
	getRoutes: getRoutes,
	postRoutes: postRoutes
};