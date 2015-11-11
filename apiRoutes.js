var _ = require("lodash");
var persistence = require("./persistence");
var Promise = require("bluebird");

var apiPath = "/v1";

var frontendRoutes = [
	{
		url: "/admin",
		handler: function (req, res) {
			var templateFile = require("fs").readFileSync("./template/index.template");
			var renderPage = _.template(templateFile);
			// Myself in the future, I apologise this
			var queryCount = 6;
			var queriesReady = 0;
			var data = {};
			var saveResult = function(key, result) {
				++queriesReady;
				data[key] = result[key];
				if (queryCount == queriesReady) {
					
					res.send(renderPage(data));
				}
			}
			persistence.fetchAll("player")
				.then(saveResult.bind(null, "players"));
			persistence.fetchAll("game")
				.then(saveResult.bind(null, "games"));
			persistence.fetchAll("track")
				.then(saveResult.bind(null, "tracks"));
			persistence.fetchAll("car")
				.then(saveResult.bind(null, "cars"));
			persistence.fetchAll("record")
				.then(saveResult.bind(null, "records"));
			persistence.fetchAll("contest")
				.then(saveResult.bind(null, "contests"));
			
		}
	},
	{
		url: "/submit",
		handler: function (req, res) {
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

			// Get related cars
			var getPlayers = function(dataObj) {
				return new Promise(function(resolve, reject) {
					persistence.fetchAll("player")
						.then(function(result) {
							dataObj.players = result.players;
							resolve(dataObj);
						});
				});
			};

			// Get list of contests
			var parseContests = function(data) {
				var templateFile = require("fs").readFileSync("./template/submit.template");
				var renderPage = _.template(templateFile);

				data.contests.forEach(contest => {
					var game = _.find(data.games, game => game.gameid === contest.game);
					contest.game = game ? game.name : "error";
					var track = _.find(data.tracks, track => track.trackid === contest.track);
					contest.track = track ? track.name : "error";
					var car = _.find(data.cars, car => car.carid === contest.car);
					contest.car = car ? car.name : "error";
				});
				var pageContent = renderPage({
					contests: data.contests,
					players: data.players
				});
				
				res.send(pageContent);
			};
			var contests = persistence.fetchAll("contest")
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(getPlayers)
				.then(parseContests);
		}
	}
];

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
			};
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
					var query = [
						"SELECT * FROM record", 
						"JOIN player ",
						"ON player.playerid = record.player",
						"WHERE contest = ?",
						"ORDER BY time"
					].join(" ");
					persistence.rawGet(query, [dataObj.contestid])
						.then(function(dbData) {
							dataObj.records = dbData;
							resolve(dataObj);
						});
				});
			};

			// Get list of contests
			var parseContests = function(data) {
				data.records = data.records
					.map(record => { 
						return { 
							name: record.name, 
							time: record.time, 
							date: record.date 
						}; 
					});
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
			persistence.insert("contest", [req.body.game, req.body.car, req.body.track])
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added contest");
				});
		}
	},
	{
		url: "/record",
		handler: function (req, res) {
			console.log("Adding record");
			var params = [
				req.body.time,
				req.body.playerid,
				req.body.contestid,
				new Date().getTime()
			]
			persistence.insert("record", params)
				.then(function(status, something) {
					console.log("Record inserted", JSON.stringify(params));
					res.status(status ? 200 : 418).send("Record added succesfully " + JSON.stringify(params));
				});
		}
	}
];

module.exports = {
	apiPath: apiPath,
	frontendRoutes: frontendRoutes,
	getRoutes: getRoutes,
	postRoutes: postRoutes
};