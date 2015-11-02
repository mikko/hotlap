express = require('express');
var _ = require("lodash");
var path = require("path");
var persistence = require("./persistence");
var routes = require("./apiRoutes");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
//app.use("/", express.static(path.resolve(__dirname, "index.html") ));

persistence.open();

app.get("/admin", function (req, res) {
	var templateFile = require("fs").readFileSync("./template/index.template");
	var renderPage = _.template(templateFile);
	var data = {
		players: [],
		games: [],
		tracks: [],
		cars: [],
		records: []
	}
	res.send(renderPage(data));
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
