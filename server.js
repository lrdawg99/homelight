var http = require('http');
	path = require('path');
	fs = require('fs');
	express = require('express');
	app = express();
	port = process.env.PORT || 3000;
	router = express.Router();
	mongoose = require('mongoose');
	lights = require('./models/lights');
	bodyParser = require('body-parser');


console.log("Homelight online.");

//Serve the dashboard
//Respond to asynchronous events
//Maintain state of the house
//Send requests to lighting devices

//Connect to monogoDB
mongoose.connect('mongodb://localhost:27017/homelight')

//Initialize route
router.get('/', function(req, res) {
	res.json({message: 'welcome to homelight'});
});

//Routers prefixed with /api
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use('/api', router);

//Start server
app.listen(port);
console.log('please use port ' + port)



//Route with prefix /lights
var lightsRoute = router.route('/lights');

//endpoint /api/lights for POSTS
lightsRoute.post(function(req, res) {
	var light = new lights();

	light.id = req.body.id;
	light.type = req.body.type;
	light.value = req.body.value;

	// save it
	light.save(function(err) {
		if (err)
			res.send(err);

		res.json({ message: 'Light added to db.', data: light});
	});
});

//endpoint /api/lights for GET 
lightsRoute.get(function(req, res) {
	lights.find(function(req, res) {
		if (err)
			res.send(err);

		res.json(beers);
	});
});