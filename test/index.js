var upyun = require("../lib/index.js");
var instance = upyun("kitgram", "welefen", "xxx");
instance.mkDir('/1/2/3/4/5/5').then(function(data){
	console.log((data));
}).catch(function(err){
	console.log(err);
})