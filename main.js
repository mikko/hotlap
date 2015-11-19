var express                 = require('express');
var _                       = require('lodash');
var path                    = require('path');
var bodyParser              = require('body-parser');

var persistence             = require('./persistence');
var routes                  = require('./apiRoutes');

// # Init server biznizz
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

persistence.init();


// # Cors
const cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
}
app.use(routes.apiPath + '/*', cors);



// # Routes
app.use(express.static('public'));

routes.frontendRoutes.forEach(function(route) {
    app.get('/backdoor' + route.url, route.handler);
});

routes.getRoutes.forEach(function(route) {
    app.get(routes.apiPath + route.url, route.handler);
});

routes.postRoutes.forEach(function(route) {
  app.post(routes.apiPath + route.url, route.handler);
});


// # Start the server
var server = app.listen(3000, function () {
    console.log('Hotlap server listening at http://%s:%s', server.address().address, server.address().port);
});
