var _ = require("lodash");
var persistence = require("./persistence");
var Promise = require("bluebird");

var apiPath = "/v1";

var getRoutes = [
	{
		url: "/contest",
		handler: function(req, res) {
			// Get related games
			var getGames = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var gameIds = dataObj.contests.map(contest => contest.game);
					persistence.fetchIn("game", gameIds)
						.then(function(dbData) {
							dataObj.games = dbData;
							resolve(dataObj);
						});
				});
			};
			// Get related tracks
			var getTracks = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var trackIds = dataObj.contests.map(contest => contest.track);
					persistence.fetchIn("track", trackIds)
						.then(function(dbData) {
							dataObj.tracks = dbData;
							resolve(dataObj);
						});
				});
			};
			// Get related cars
			var getCars = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var carIds = dataObj.contests.map(contest => contest.car);
						persistence.fetchIn("car", carIds)
							.then(function(dbData) {
								dataObj.cars = dbData;
								resolve(dataObj);
							});
				});
			};

			// Get list of contests
			var parseContests = function(data) {
				data.contests.forEach(contest => {
					var game = _.find(data.games, game => game.gameid === contest.game);
					contest.game = game ? game.name : "error";
					var track = _.find(data.tracks, track => track.trackid === contest.track);
					contest.track = track ? track.name : "error";
					var car = _.find(data.cars, car => car.carid === contest.car);
					contest.car = car ? car.name : "error";
				});
				res.send({contests: data.contests});
			}
			var contests = persistence.fetchAll("contest")
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(parseContests);
		}
	},
	{
		url: "/contest/:id",
		handler: function(req, res) {
			var getGames = function(dataObj) {
				return new Promise(function(resolve, reject) {
					persistence.fetch("game", dataObj.game)
						.then(function(dbData) {
							dataObj.game = dbData.name;
							resolve(dataObj);
						});
				});
			};
			// Get related tracks
			var getTracks = function(dataObj) {
				return new Promise(function(resolve, reject) {
					persistence.fetch("track", dataObj.track)
						.then(function(dbData) {
							dataObj.track = dbData.name;
							resolve(dataObj);
						});
				});
			};
			// Get related cars
			var getCars = function(dataObj) {
				return new Promise(function(resolve, reject) {
					persistence.fetch("car", dataObj.car)
						.then(function(dbData) {
							dataObj.car = dbData.name;
							resolve(dataObj);
						});
				});
			};

			// Get related cars
			var getRecords = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var query = "SELECT * FROM record WHERE contest = " + dataObj.contestid;
					persistence.rawGet(query)
						.then(function(dbData) {
							dataObj.records = dbData;
							resolve(dataObj);
						});
				});
			};

			// Get list of contests
			var parseContests = function(data) {
				data.records = data.records || [];
				res.send(data);
			}
			var contests = persistence.fetch("contest", req.params.id)
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(getRecords)
				.then(parseContests);
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
			console.log("Adding track", JSON.stringify(req.body));
			persistence.insert("track", [req.body.track, req.body.game])
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added track");
				});
		}
	},
	{
		url: "/car",
		handler: function (req, res) {
			console.log("Adding car");
			persistence.insert("car", [req.body.car, req.body.game])
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added car");
				});
		}
	},
	{
		url: "/contest",
		handler: function (req, res) {
			console.log("Adding contest");
			persistence.insert("car", [req.body.game, req.body.car, req.body.track])
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