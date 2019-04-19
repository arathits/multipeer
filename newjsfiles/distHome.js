var express = require('express');
var app = express();
var path =require('path')
var reg = require('./javascript/registerUser')
var inv = require('./javascript/invoke');
var que = require('./javascript/query');
var trp = require('./javascript/transferProduct');
var gth = require('./javascript/getHistory');
//var qall = require('./javascript/queryAll');
//var qs = require('querystring');

let user = 'distributer';

app.get('/', function(req, res){
   res.render('home.pug');
});

app.get("/register", function(req, res) {
  reg.func(req.query.regname,res);
  //res.redirect('/');
  res.render('home.pug',{regresult: "Registration Successfull ... Login to Proceed"});
});

app.get('/login', function(req, res){
   que.func(req.query.username,user,res);
});

app.get('/logout', function(req, res){
   res.redirect('/');
});

app.get('/getHistory', function(request, response){
  gth.func(request.query.uname, request.query.gid, user, response);
});

app.get('/transferProduct', function(request, response){
  trp.func(request.query.uname, request.query.tid, request.query.rname, request.query.tqty, request.query.rloc, user, response);
});

app.listen(3060, () => console.log('Running on a localhost:3060'));
