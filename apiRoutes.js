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
			persistence.fetchAll("leaderboard")
				.then(saveResult.bind(null, "leaderboards"));
			
		}
	},
	{
		url: "/submit",
		handler: function (req, res) {
			// Get related games
			var getGames = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var gameIds = dataObj.leaderboards.map(leaderboard => leaderboard.game);
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
					var trackIds = dataObj.leaderboards.map(leaderboard => leaderboard.track);
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
					var carIds = dataObj.leaderboards.map(leaderboard => leaderboard.car);
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

			// Get list of leaderboards
			var parseleaderboards = function(data) {
				var templateFile = require("fs").readFileSync("./template/submit.template");
				var renderPage = _.template(templateFile);

				data.leaderboards.forEach(leaderboard => {
					var game = _.find(data.games, game => game.id === leaderboard.game);
					leaderboard.game = game ? game.name : "error";
					var track = _.find(data.tracks, track => track.id === leaderboard.track);
					leaderboard.track = track ? track.name : "error";
					var car = _.find(data.cars, car => car.id === leaderboard.car);
					leaderboard.car = car ? car.name : "error";
				});
				var pageContent = renderPage({
					leaderboards: data.leaderboards,
					players: data.players
				});
				
				res.send(pageContent);
			};
			var leaderboards = persistence.fetchAll("leaderboard")
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(getPlayers)
				.then(parseleaderboards);
		}
	}
];

var getRoutes = [
	{
		url: "/leaderboard",
		handler: function(req, res) {
			// Get related games
			var getGames = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var gameIds = dataObj.leaderboards.map(leaderboard => leaderboard.game);
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
					var trackIds = dataObj.leaderboards.map(leaderboard => leaderboard.track);
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
					var carIds = dataObj.leaderboards.map(leaderboard => leaderboard.car);
						persistence.fetchIn("car", carIds)
							.then(function(dbData) {
								dataObj.cars = dbData;
								resolve(dataObj);
							});
				});
			};

			// Get related records
			var getRecords = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var query = [
						"SELECT * FROM record", 
						"JOIN player ",
						"ON player.id = record.player",
						"WHERE leaderboard IN (",
						dataObj.leaderboards.map((lb, i) => "$" + (i + 1)),
						")",
						"ORDER BY time"
					].join(" ");
					var values = dataObj.leaderboards.map(lb => lb.id);
					console.log(query, values);
					persistence.rawGet(query, values)
						.then(function(dbData) {
							console.log("Records for", dataObj.leaderboards[0].id, dbData);
							dataObj.records = dbData;
							resolve(dataObj);
						});
				});
			};

			// Get list of leaderboards
			var parseLeaderboards = function(data) {
				data.leaderboards.forEach(leaderboard => {
					var game = _.find(data.games, game => game.id === leaderboard.game);
					leaderboard.game = game ? game.name : "error";
					var track = _.find(data.tracks, track => track.id === leaderboard.track);
					leaderboard.track = track ? track.name : "error";
					var car = _.find(data.cars, car => car.id === leaderboard.car);
					leaderboard.car = car ? car.name : "error";
					var records = _.filter(data.records, records => records.leaderboard === leaderboard.id);
					leaderboard.records = records || "error";
				});
				res.send({leaderboards: data.leaderboards});
			};
			var leaderboards = persistence.fetchAll("leaderboard")
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(getRecords)
				.then(parseLeaderboards);
		}
	},
	{
		url: "/leaderboard/:id",
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

			// Get related records
			var getRecords = function(dataObj) {
				return new Promise(function(resolve, reject) {
					var query = [
						"SELECT * FROM record", 
						"JOIN player ",
						"ON player.id = record.player",
						"WHERE leaderboard = $1",
						"ORDER BY time"
					].join(" ");
					persistence.rawGet(query, [dataObj.leaderboard])
						.then(function(dbData) {
							dataObj.records = dbData;
							resolve(dataObj);
						});
				});
			};

			// Get list of leaderboards
			var parseleaderboards = function(data) {
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
			var leaderboards = persistence.fetch("leaderboard", req.params.id)
				.then(getGames)
				.then(getTracks)
				.then(getCars)
				.then(getRecords)
				.then(parseleaderboards);
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
		url: "/leaderboard",
		handler: function (req, res) {
			console.log("Adding leaderboard");
			persistence.insert("leaderboard", [req.body.game, req.body.car, req.body.track])
				.then(function(status) {
					res.status(status ? 200 : 418).send("Added leaderboard");
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
				req.body.leaderboardid,
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