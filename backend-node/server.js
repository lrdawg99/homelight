//Homelight. By Logan Rooper 2014 logan.rooper@gmail.com
//Serve the dashboard
//Respond to asynchronous events
//Maintain state of the house
//Send requests to lighting devices

var http = require('http');
	request = require('request');
	path = require('path');
	fs = require('fs');
	express = require('express');
	app = express();
	port = process.env.PORT || 3000;
	router = express.Router();
	mongoose = require('mongoose');
	lights = require('./models/lights');
	bodyParser = require('body-parser');

//Same origin
var xdomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST');
	next();
}
app.use(xdomain);

//System states
var systemState = ""; //initially
var detectionData = {	 //dummy data until we get modules which will update it.
	0: 'active',
	1: 'inactive',
	2: 'inactive',
	3: 'inactive'
}

//Configuration - defaults for hue router
var options = {
	host: '152.3.3.241',
	port: 80,
	path: '',
	method: 'GET',
	headers: ''
};
var hueValue = 0; //max 65535
var n = 1;
var color = 0;
var date = new Date();
var season_sunset_offset = 0;
var securityMode = false;
var timebase_status = "not_running";
var timebase_interval = null;

//map id to hue id
var hue = {
	1: 1,
	2: 2
}

//Debug
console.log("Homelight online.");
console.log("Initial system state: " + systemState)


//Connect to monogoDB
mongoose.connect('mongodb://localhost:27017/homelight')
//TODO: error handling for mongodb failure

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
	lights.find(function(err, lights) {
		if (err)
			res.send(err);

		res.json(lights);
	});
});

//Route with prefix /systemstate
var systemstate = router.route('/systemstate');

//return the current state
systemstate.get(function(req, res) {
	res.json({state: systemState});
});

//endpoint /api/systemstate for POSTS
systemstate.post(function(req, res) {
	//we have a manual override request- turn timebased routine off.
	timebase_status = "not_running";
	console.log("recived a /api/systemstate POST");

	temp = req.body.state;
	color  = req.body.hue;	
	//sanitize
	status = stateChange(temp);

	res.json({ message: 'System state change method', state: systemState, status: status});
});

function stateChange(state) {
	console.log("state change requested: " + state);
	switch (state) {
		case 'demo':
			//demo some color changes. turn on the color changer timer
			if (systemState != 'demo') {
				systemState = 'demo';
				var iv = setInterval(colorDemo, 200);
			}
			
			break;
		case 'waves':
			//david's waves
			if (systemState != 'waves') {
				systemState = 'waves';
				var iv = setInterval(waves, 200); //interval == 200 ms
			}
			break;
		case 'timebased':
			//turn on time based control routine
			if (timebase_status != "running") {
				timebase_status = "running";
				if (timebase_interval == null) {
					timebase_interval = setInterval(timebase, 1000);
				}
			}
			break;
		case 'on':
			//simply turn on
			if (systemState != 'on') {
				for (var id in hue) {
					console.log(hue[id])
					var payload = {
						on : true
					};
					if (!put('/api/loganrooper/lights/'+hue[id]+'/state', payload)) {
						face//errors
						return 'connection to hue has errors';
					}
				}
				systemState = 'on'
			}
			break;
		case 'off':
			//simply turn off
			if (systemState != 'off') {
				for (var id in hue) {
					var payload = {
						on : false
					};
					if (!put('/api/loganrooper/lights/'+hue[id]+'/state', payload)) {
						//errors
						return 'connection to hue has errors';
					}
				}
				systemState = 'off'
			}
			break;
		case 'set':
			//turn on to certain color
			for (var id in hue) {
				var payload = {
					on : true,
					bri: 50,
					hue: color*1, //cast to int...
					sat: 255
				};
				console.log(color)
				if (!put('/api/loganrooper/lights/'+hue[id]+'/state', payload)) {
					//errors
					return 'connection to hue has errors';
				}
			}
			systemState = 'set'
			break;
		default:
			return 'invalid state';
	}
	console.log('system state is now: ' + systemState);
	return 'OK';
}


function put(p, payload) {
	myOptions = options;
	myOptions.path = p;
	myOptions.method = 'put'

	var payloadString = JSON.stringify(payload);
	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': payloadString.length
	}
	myOptions.headers = headers;
	var req = http.request(myOptions, function(res) {
		//Recieved message
		res.setEncoding('utf-8');
		var responseString = '';

		res.on('data', function(data) {
			responseString += data;
		})

		res.on('end', function() {
			//TODO: catch non-json incoming data
			var resultObj = JSON.parse(responseString);
		});
	});

	req.on('error', function(e) {
		console.log(e);
		return false;
	});

	req.write(payloadString);
	req.end();
	return true;
}

//shift through the hues every 1/3 s
function colorDemo() {
	if (systemState != "demo") {
		//no more
		return;
	}

	for (var id in hue) {
		var payload = {
			on : true,
			bri: 255,
			hue: hueValue,
			sat: 255
		};
		//console.log(JSON.stringify(payload))
		if (!put('/api/loganrooper/lights/'+hue[id]+'/state', payload)) {
			//errors
			console.log('connection to hue has errors');
		}
	}
	hueValue += 3000*n;
	if (hueValue > 65535 || hueValue < 1) {
		n *= -1;
	}

}

//all time based functions
//every 1s
function timebase() {
	//timebased will interupt all other routines once started, until shutdown
	
	//TODO: turn timebase off completely by killing the interval function.
	if (timebase_status != "running") {
		return;
	}

	var current_hour = date.getHours();
	var current_month = date.getMonth();

	//Daytime (7:00 - 19:00)
	if (current_hour >= 7 && current_hour < 18+season_sunset_offset) {
		//TODO: fade in from sunrise to sunrise+1hr
		
		//TODO: change hue/sat value in feedback loop from color zone sensor!
		
		//Turn on when active.
		if (hasActive(detectionData)) {
			stateChange('on');
		}
	//Nighttime (19:00 - 2:00)
	} else if (current_hour >= 18+season_sunset_offset || current_hour < 2) {
		//TODO: Flux full transition from 19:00 to 21:30
		
		//Turn on when active.
		if (hasActive(detectionData)) {
			stateChange('on');
		}
	}
	//Supernight (2:00 - 7:00)
	else if (current_hour >= 2 && current_hour < 7) {
		//Turn on when active.
		//TODO: only 10% brightness.
		if (hasActive(detectionData)) {
			stateChange('on'); //TODO: Per zone.
		}
	}

	//TODO: grab realtime sunrise/set data from internet
	//Sunrise accent effect
	if (0) {
		//TODO: Flash accents red, yellow, blue
	}

	//Sunset accent effect
	if (0) {
		//TODO: Flash accents red, yellow, blue
	}

	//TODO: grab data from ical file off the internet every day. 
	//Calendar effects
	if (0) { //if event_start
		//TODO: Flash accents red, yellow, blue
	}

	//check for securityMode
	if (hasActive(detectionData) && securityMode) {
		//disable it
		securityMode = false;
		//TODO: Flash welcome home accent pattern.
	}

	//Seasonal changes
	//Summer- push sunset back.
	if (current_month > 4 || current_month < 9) {
		season_sunset_offset = 1.5;
	}
	
	//TODO: Update the light/history database here.
	//TODO: Check if database has no records for last 24 hours
	//Security Mode: simulate house
	if (0) {
		var securityMode = true;
		//TODO: Implment security mode
	}
	//TODO: Parse duke api for warnings
	if (0) {
		//TODO: Check if it's an updated posting or not, and if so, flash accents red/yellow every 30s until disabled.
	}

}

//do any of the zones have an active module?
function hasActive(dat) {
	for (var i = 0; i < Object.keys(dat).length; i++) {
		if (dat[i] == 'active') {
			return true;
		}
	}
	return false;
}

//david's wave pattern
var waveOneHue = 46920; //hue ranges from 0 65535 along the color spectrum
var waveTwoHue = 40000; //blue
var j = 1;
var n = 1;
function waves() {
	if (systemState != "waves") {
		//no more
		return;
	}

	//this state occurs every 200 ms
	waveOneHue += 1000*j;
	if (waveOneHue > 45000 || waveOneHue < 37000) {
		j *= -1;
	}
	waveTwoHue += 1000*n;
	if (waveTwoHue > 43000 || waveTwoHue < 40000) {
		n *= -1;
	}

	//put hue 1 value
	var payload = {
		on : true,
		bri: 255,
		hue: waveOneHue,
		sat: 255
	};
	//console.log(JSON.stringify(payload))
	if (!put('/api/loganrooper/lights/1/state', payload)) {
		//errors
		console.log('connection to hue has errors');
	}

	//put hue 2 value
	var payload = {
		on : true,
		bri: 255,
		hue: waveTwoHue,
		sat: 255
	};
	//console.log(JSON.stringify(payload))
	if (!put('/api/loganrooper/lights/2/state', payload)) {
		//errors
		console.log('connection to hue has errors');
	}
}
