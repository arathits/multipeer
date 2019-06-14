var express = require('express');
var app = express();
var path =require('path')

var reg = require('./javascript/registerUser')
var inv = require('./javascript/invoke');
var que = require('./javascript/query');
var blk = require('./javascript/getBlockHeight');
var gth = require('./javascript/getHistory');

let user = 'supplier';

app.get('/', function(req, res){
   res.render('home.pug');
});

app.get("/register", function(req, res) {
  reg.func(req.query.regname,req.query.regpass,res);
  res.render('home.pug',{regresult: "Registration Successfull ... Login to Proceed"});
});

app.get('/loginauth', function(req, res){
	var sha = require('js-sha256');
    var lineReader = require('readline').createInterface({
  			input: require('fs').createReadStream('login.txt')
	});

	var pwd = sha.sha256(req.query.password);
	lineReader.on('line', function (line) {

  	str=line.split(" ");
  	if(str[0]==req.query.username && str[1]==pwd)
	{	console.log("Login successful");	
		que.func(req.query.username,user,res);
	}
	});
});

app.get('/login', function(req, res){
   que.func(req.query.username,user,res);
});


app.get('/logout', function(req, res){
   res.redirect('/');
});

app.get('/invoke', function(request, response){
  inv.func(request.query.sname, request.query.ptype, request.query.pname, request.query.pqty, request.query.ploc, user, response);
});

app.get('/query', function(request, response){
  que.func(request.query.uname, user, response);
});

app.get('/getHistory', function(request, response){
  gth.func(request.query.uname, request.query.gid, user, response);
});

app.get('/getBlockHeight', function(request, response){
  blk.func(request.query.uname, user, response);
});

app.listen(3000, () => console.log('Running on a localhost:3000'));
