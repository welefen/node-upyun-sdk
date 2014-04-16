## 介绍

==============

此模块为又拍云SDK的Node.js版本，使用Promise机制。

## 安装

```
npm install node-upyun-sdk
```

## 使用

```
var upyun = require("node-upyun-sdk");
var instance = upyun("bucketname", "username", "password");
```

下面的所有接口返回的都是一个promise，可以通过下面的方式来获取返回值和捕获错误：

```
instance.getUsage("/").then(function(data){
    console.log(data);
}).catch(function(error){
    console.log(error);
})
```

### getUsage(path)

* path string 目录名

获取目录的空间占用信息

```
instance.getUsage("/"); //获取根目录的空间使用情况
instance.getUsage("/foo/bar"); //获取/foo/bar目录的空间使用情况
```

### upload(savePath, filePath, headers)

* savePath string 又拍云上存放的目录
* filePath string 本地要上传的目录
* headers  object|string 附带的headers

文件或者文件夹上传

```
instance.upload("/aaa/", "img/c.jpg"); //将c.jpg文件上传到/aaa/下，保存的文件名为c.jpg
instance.upload("/aaa/a.jpg", "img/c.jpg"); //下c.jpg文件上传到/aaa/下，重新设置文件名为a.jpg
instance.upload("/aaa", "img/"); //将img/下的所有文件上传到/aaa目录下
instance.upload("/aaa/a.jpg", "img/c.jpg", "welefen"); //设置文件的Content-Secret上传
instance.upload("/aaa/a.jpg", "img/c.jpg", {
    "x-gmkerl-type": "fix_width",
    "x-gmkerl-value": 150
}); //设置图片处理信息
```

### download(soucePath, savePath)

* sourcePath string 又拍云上的目录
* savePath string 存储的目录

文件或者文件夹下载

```
instance.download("/aaa", "img/"); //将/aaa目录下的文件下载到img目录下，包含子目录
instance.download("/aaa/a.jpg", "img/"); //将a.jpg文件下载到img目录下
instacen.download("/aaa/a.jpg", "img/c.jpg"); //将a.jpg文件下载到img目录并重命名为c.jpg
```

### rm(path, force)

* path string 要删除的文件夹或者文件
* force boolean 是否强制删除，强制后会递归删除目录下所有的文件

删除文件或者文件夹

```
instance.rm("/aaa"); //删除/aaa目录，/aaa目录下必须为空
instance.rm("/aaa", true); //删除/aaa目录，如果/aaa下有子目录或者文件，先删除这些子目录和文件
instance.rm("/aaa/a.jpg"); //删除a.jpg文件
```

### mkDir(path)

* path string 要创建的目录

创建目录

```
instance.mkDir("/aaa/bbb"); //递归的创建/aaa/bbb目录
```

### readDir(path, recursive)

* path string 要读取的文件夹
* recursive boolean 是否是递归方式，递归方式数据里会有children字段信息

获取文件夹下的文件和子目录信息

```
instance.readDir("/aaa"); //获取/aaa目录下的文件和子目录
instance.readDir("/aaa", true); //获取/aaa目录下的文件和子目录，包含子目录详细信息
```

### getInfo(path)

* path string 要获取信息的path

获取文件或者文件夹的信息

```
instance.getInfo("/aaa"); //获取/aaa文件夹的信息
instance.getInfo("/aaa/a.jpg"); //获取a.jpg文件的信息
```
