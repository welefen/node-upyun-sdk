var upyun = require("../lib/index.js");
var instance = upyun("kitgram", "welefen", "suredy0706");
instance.readDir('/imgs/').then(function(data){
	console.log(JSON.stringify(data));
}).catch(function(err){
	console.log(err);
})