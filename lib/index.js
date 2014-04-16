var util = require("thinkjs-util");
var request = require("request");
var fs = require("fs");
var path = require("path");

module.exports = util.Class(function(){
	return {
		/**
		 * 接口的域名
		 * @type {String}
		 */
		domain: "v0.api.upyun.com",
		/**
		 * 初始化
		 * @param  {[type]} bucketname [description]
		 * @param  {[type]} username   [description]
		 * @param  {[type]} password   [description]
		 * @return {[type]}            [description]
		 */
		init: function(bucketname, username, password){
			this.bucketname = bucketname;
			this.username = username;
			this.password = util.md5(password);
		},
		/**
		 * 设置接口的domain
		 * @param {[type]} domain [description]
		 */
		setDomain: function(domain){
			this.domain = domain;
			return this;
		},
		/**
		 * 签名
		 * @param  {[type]} method [description]
		 * @param  {[type]} uri    [description]
		 * @param  {[type]} date   [description]
		 * @param  {[type]} length [description]
		 * @return {[type]}        [description]
		 */
		sign: function(method, uri, date, length){
			var sign = method + '&' + uri + '&' + date + '&' + length +'&' + this.password;
			return 'UpYun ' + this.username + ':' + util.md5(sign);
		},
		/**
		 * 获取文件或者文件夹的信息
		 * @param  {[type]} file [description]
		 * @return {[type]}      [description]
		 */
		getInfo: function(file){
			return this.request(file, 'HEAD').then(function(response){
				var headers = response.headers;
				return {
					type: headers['x-upyun-file-type'],
					size: headers['x-upyun-file-size'],
					date: headers['x-upyun-file-date']
				}
			})
		},
		/**
		 * 查看空间占用信息
		 * @return {[type]} [description]
		 */
		getUsage: function(path){
			path = path || "/";
			return this.request(path + "?usage").then(function(response){
				return parseInt(response.body, 10);
			})
		},
		/**
		 * 从返回的headers里获取图片的信息
		 * @param  {[type]} response [description]
		 * @return {[type]}          [description]
		 */
		getPicInfo: function(response){
			var headers = response.headers;
			return {
				width: headers['x-upyun-width'],
				height: headers['x-upyun-height'],
				frames: headers['x-upyun-frames'],
				type: headers['x-upyun-file-type']
			}
		},
		/**
		 * 上传文件或者文件夹
		 * @param  {[type]} savePath [description]
		 * @param  {[type]} filePath [description]
		 * @return {[type]}          [description]
		 */
		upload: function(savePath, filePath, headers){
			var defaultHeaders = {
				mkdir: true
			};
			if (util.isObject(headers)){
				defaultHeaders = util.extend(defaultHeaders, headers);
			}else if (headers) {
				defaultHeaders["Content-Secret"] = headers;
			}
			var self = this;
			//文件上传
			if (util.isFile(filePath)) {
				var stream = fs.readFileSync(filePath);
				return this.request(savePath, 'PUT', stream, defaultHeaders).then(function(response){
					return self.getPicInfo(response);
				});
			}else if (util.isDir(filePath)) { //文件夹上传
				if (savePath.slice(-1) !== '/') {
					savePath += '/';
				}
				if (filePath.slice(-1) !== '/') {
					filePath += '/';
				}
				var promises = [];
				var files = fs.readdirSync(filePath);
				files.forEach(function(item){
					var nFilePath = filePath + item;
					var state = fs.statSync(nFilePath);
					if (state.isFile() || state.isDirectory()) {
						var promise = self.upload(savePath + item, nFilePath);
						promises.push(promise);
					}
				});
				if (promises.length) {
					return util.Promise.all(promises);
				}else{
					return self.mkdir(savePath);
				}
			}else{ //普通内容上传
				return this.request(savePath, 'PUT', filePath, defaultHeaders).then(function(response){
					return self.getPicInfo(response);
				});
			}
		},
		/**
		 * 文件或者文件夹下载
		 * @param  {[type]} path     [description]
		 * @param  {[type]} savePath [description]
		 * @return {[type]}          [description]
		 */
		download: function(sourcePath, savePath, typeData){
			sourcePath = sourcePath || "/";
			if (savePath && savePath.slice(-1) !== "/") {
				savePath += "/";
			}
			var self = this;
			var promise = typeData ? util.getPromise(typeData) : this.getInfo(sourcePath);
			return promise.then(function(data){
				if (data.type === 'folder') {
					if (sourcePath.slice(-1) !== "/") {
						sourcePath += "/";
					}
					return self.readDir(sourcePath).then(function(data){
						var promises = [];
						data.forEach(function(item){
							var nPath = sourcePath + item.name;
							var promise;
							//文件夹
							if (item.type === 'F') {
								promise = self.download(nPath + "/", savePath + item.name + "/", {
									type: 'folder'
								});
							}else if (item.type){ //文件
								promise = self.download(nPath, savePath, {
									type: 'file'
								});
							}
							promises.push(promise);
						});
						return util.Promise.all(promises);
					});
				}else{
					//单个文件
					return self.request(sourcePath, 'GET', '', {}, {
						encoding: null
					}).then(function(response){
						if (!savePath) {
							return response.body;
						}
						var sourceExt = path.extname(sourcePath);
						var saveExt = path.extname(savePath);
						var fileSavePath = savePath;
						if (sourceExt && sourceExt === saveExt) {
							util.mkdir(path.dirname(savePath));
						}else{
							util.mkdir(savePath);
							fileSavePath = savePath + path.basename(sourcePath);
						}
						fs.writeFileSync(fileSavePath, response.body);
					})
				}
			});
		},
		/**
		 * 删除文件或者文件夹
		 * @param  {[type]} path  [description]
		 * @param  {[type]} force [description]
		 * @return {[type]}       [description]
		 */
		rm: function(path, force){
			if (!path) {
				return util.getPromise(new Error("path can't empty"), true);
			}
			if (path.slice(-1) !== '/') {
				path += '/';
			};
			var self = this;
			return this.getInfo(path).then(function(data){
				if (data.type === 'folder') {
					if (!force) {
						return self.request(path, 'DELETE').then(function(response){
							return response.body;
						})
					}
					return self.readDir(path).then(function(data){
						var promises = [];
						data.forEach(function(item){
							var nPath = path + item.name;
							var promise;
							//文件夹
							if (item.type === 'F') {
								promise = self.rm(nPath + "/", true);
							}else if (item.type){ //文件
								promise = self.rm(nPath);
							}
							promises.push(promise);
						});
						if (promises.length) {
							return util.Promise.all(promises);
						}
					}).then(function(){
						return self.rm(path, false);
					})
				}else{
					return self.request(path, 'DELETE').then(function(response){
						return response.body;
					});
				}
			})
		},
		/**
		 * 递归创建目录
		 * @param  {[type]} path [description]
		 * @return {[type]}      [description]
		 */
		mkDir: function(path){
			return this.request(path, 'PUT', '', {
				mkdir: true,
				folder: true
			}).then(function(response){
				return response.body;
			})
		},
		/**
		 * 读取目录下的文件和子目录
		 * @param  {[type]} dir [description]
		 * @return {[type]}     [description]
		 */
		readDir: function(path, recursive){
			path = path || "/";
			if (path.slice(-1) !== '/') {
				path += '/';
			};
			var self = this;
			return this.request(path, "GET").then(function(response){
				var dirs = response.body.split("\n");
				var result = [];
				var promises = [];
				for (var i = 0; i < dirs.length; i++) {
					var dir = dirs[i];
					var attrs = dir.split("\t");
					dir = {
						name: attrs[0],
						type: attrs[1],
						size: attrs[2],
						time: attrs[3]
					};
					if (recursive && dir.type === 'F') {
						var promise = self.readDir(path + dir.name, true).then(function(data){
							dir.children = data;
						});
						promises.push(promise);
					}
					result.push(dir);
				}
				if (promises.length) {
					return util.Promise.all(promises).then(function(){
						return result;
					});
				}else{
					return result;
				}
			})
		},
		/**
		 * 请求数据
		 * @param  {[type]} uri     [description]
		 * @param  {[type]} method  [description]
		 * @param  {[type]} data    [description]
		 * @param  {[type]} headers [description]
		 * @param  {[type]} options [description]
		 * @return {[type]}         [description]
		 */
		request: function(uri, method, data, headers, options){
			uri = "/" + this.bucketname + uri;
			method = method || "GET";
			headers = headers || {};
			var length = 0;
			if (data) {
				length = !util.isBuffer(data) ? Buffer.byteLength(data) : data.length;
			}
			var date = (new Date()).toUTCString();
			var Authorization = this.sign(method, uri, date, length);
			headers = util.extend(headers, {
				'Expect': "",
				'Content-Length': length,
				'Date': date,
				'Authorization': Authorization
			});
			var deferred = util.getDefer();
			var opts = util.extend({
				url: "http://" + this.domain + uri,
				method: method,
				body: data || "",
				headers: headers
			}, options);
			request(opts, function(error, response, body){
				if (error || response.statusCode !== 200) {
					deferred.reject(error || "statusCode: " + response.statusCode + "; body: " + body);
				}else{
					deferred.resolve(response);
				}
			});
			return deferred.promise;
		}
	}
});