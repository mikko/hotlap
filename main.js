express = require('express');
var _ = require("lodash");
var path = require("path");
var persistence = require("./persistence");
var routes = require("./apiRoutes");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

const cors = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
    next();
}
app.use("/v1/*", cors);

persistence.open();

app.get("/admin", function (req, res) {
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
	
});

routes.getRoutes.forEach(function(route) {
	app.get(routes.apiPath + route.url, route.handler);
})

routes.postRoutes.forEach(function(route) {
	app.post(routes.apiPath + route.url, route.handler);
})


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
