//packages
var mongoose = require('mongoose');

//schema
var lightSchema  = new mongoose.Schema({
	id: Number,
	type: String,
	value: String
});

//export module
module.exports = mongoose.model('lights', lightSchema);