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

persistence.init();

routes.getRoutes.forEach(function(route) {
	app.get(routes.apiPath + route.url, route.handler);
});

routes.frontendRoutes.forEach(function(route) {
	app.get(route.url, route.handler);
})

routes.postRoutes.forEach(function(route) {
	app.post(routes.apiPath + route.url, route.handler);
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
