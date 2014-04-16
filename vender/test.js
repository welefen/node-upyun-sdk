var UPYun = require('./index.js').UPYun;
// Test code

// 初始化空间
var instance = new UPYun("kitgram", "welefen", "suredy0706");
// upyun.readDir("/imgs/source", function(err, data){
//     //console.log(data)
// })
var sign = instance.sign("GET","/kitgram/imgs/source", "Wed, 16 Apr 2014 02:14:16 GMT", 0);
console.log(sign);