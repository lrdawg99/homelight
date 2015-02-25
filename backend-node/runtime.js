var http = require('http')
	path = require('path')
	fs = require('fs')

console.log("Homelight online.");

//Serve the dashboard
//Respond to asynchronous events
//Maintain state of the house
//Send requests to lighting devices

//our webserver
server = http.createServer(requestHandler)
server.listen(80)

function requestHandler(req, res) {
	//Do nothing for now.
	 res.end("Welcome to homelight.");
}

function makeGet(url) {
	http.get(url, getCallback(res));
}

function getCallback(response) {
	response.setEncoding('utf8');

	response.on("data", function(data) {
		console.log(data)
	})

	response.on("error", function(data) {
		console.log(data);
	})
}