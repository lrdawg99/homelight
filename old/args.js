var fs = require('fs')

pathname = process.argv[2]
extension = process.argv[3]
fs.readdir(pathname, receiveDir)

function receiveDir(err, list) {
	for (i = 0; i < list.length; i++) {
		out = list[i].split(".")
		//console.log(out)
		if (out.length > 1 && out[out.length-1] == extension) {
			console.log(list[i]);
		}
	}
}






/*var filepath = process.argv[2]
fs.readFile(filepath, 'utf8', receiveFile)




function receiveFile (err, data) {
	filedata = data;
	split = filedata.toString().split('\n')

	console.log(split.length - 1)
}

*/