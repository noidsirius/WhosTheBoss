
/**
 * Module dependencies.
 */

var mongojs = require('mongojs');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fb = require('facebook-js');
var app = express();
var db = mongojs('WTBass', ['pictures', 'votes', 'users']);
var appData = require('./ID.js');

// all environments
app.set('port', process.env.PORT || 3456);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/start', function (req, res) {
	res.redirect(fb.getAuthorizeUrl({
		client_id: appData.AppID,
		redirect_uri: 'http://aryazeghbali.ir:3456/auth',
		scope: 'offline_access,user_photos'
	}));
});

app.get('/auth', function (req, res) {
  fb.getAccessToken(appData.AppID, appData.AppSecret, req.param('code'), 'http://aryazeghbali.ir:3456/auth', function (error, access_token, refresh_token) {
  	if(error) {
  		res.render('error', {error: error.data});
  	}
  	else {
  		req.session.access_token = access_token;
  		fb.apiCall('GET', '/me/profile', {access_token: req.session.access_token}, function (error, response, body) {
			if(body.data == null) {
				res.render('error', {error: "login first"});
			}
			else
			{
				var userID = body.data[0].id;
				db.pictures.findOne({id: userID}, function (err, data) {
					if(!err && data != null && data.lastPic >= data.pictures.length) {
						res.render('error', {error: 'You had been subscribed to this vote'});
					}
					else {
					  	req.session.access_token = access_token;
					    // res.render('client', {title: 'Do you go?'});
					    res.redirect('photo');
					}
				});
			}
		});
	}
  });
});

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


app.get('/photo', function (req, res) {
	fb.apiCall('GET', '/me/profile', {access_token: req.session.access_token}, function (error, response, body) {
		if(body.data == null) {
			console.log(body);
			res.render('error', {error: "login first"});
		}
		else {
			db.users.save(body, function (err7) {
				var userID = body.data[0].id;
				req.session.userID = userID;
				var pictures = [];
				fb.apiCall('GET', '/me/photos', {access_token: req.session.access_token, limit: 300}, function (error, response, bbody) {
					if(bbody == null)
						res.render('error', {error: "no picture!"});   		
			    	else {
				    	for(i in bbody.data) {
				    		var pic = bbody.data[i];
				    		var validTags = [];
				    		var users = [];
				    		if(pic.tags)
				    		{
					    		for (var i = pic.tags.data.length - 1; i >= 0; i--) {
					    			if(pic.tags.data[i].id) {
					    				validTags.push(pic.tags.data[i]);
					    				users.push(pic.tags.data[i].id);
					    			}
					    		}
						    	if(validTags.length >= 3 && validTags.length <= 10) {
					    			pictures.push({picID: pic.id, users: users, pic: pic.source, width: pic.width, height: pic.height, tags: validTags, votes: []});
					    		}
				    		}
				    	}
				    	// console.log(pictures[pictures.length-1].picID);
				    	pictures = shuffle(pictures);
				    	// console.log(pictures[pictures.length-1].picID);
				    	console.log(pictures.length);
				    	function insert2db (n, err, callback) {
				    		if(n < 0)
				    			return callback(err);
				    		db.pictures.find({picID: pictures[n].picID}, function (err, data) {
				    			if (err || data.length == 0) {
				    				db.pictures.save(pictures[n], function (err2) {
				    					return insert2db(n-1, err2, callback);
				    				});
				    			}
				    			else {
				    				return insert2db(n-1, err, callback);
				    			}
				    		});
				    	}
				    	insert2db (pictures.length-1, null, function (err) {
				    		if(err){
				    			res.render('error', {error: err});
				    		}
				    		else{
				    			res.redirect('vote');
				    		}
				    	});
			    	}
				});
			});
		}
  	});

});



function getNextPic (req, res, callback, callback2) {
	db.pictures.find({users: req.session.userID}, function (err, data) {
		for (var i = data.length - 1; i >= 0; i--) {
			var flag = false;
			var votedUsers = []
			for (var j = data[i].votes.length - 1; j >= 0; j--) {
				if(data[i].votes[j].userID == req.session.userID)
					flag = true;
				else
				{
					votedUsers.push(data[i].votes[j].userID);
					console.log("DD " + data[i].votes[j].userID )
				}
			}
			if(!flag) {
				var Qs = [];
				data[i].votedUsers = votedUsers;
				var tars = shuffle(["Cinema", "Park", "a Trip", "Karting", "Climbing", "Jogging", "Workshop"]);
				var qCount = 0;
				if (data[i].tags.length < 4)
					qCount = 2
				else if (data[i].tags.length < 5)
					qCount = 3
				else if (data[i].tags.length < 7)
					qCount = 6
				else
					qCount =7
				for (var k = 0; k < qCount; k++) {
					var question = {voter : req.session.userID, target: tars[k], fn: [], fy: [], id : 1};
					
					for (var j = data[i].tags.length - 1; j >= 0; j--) {
						if(data[i].tags[j].id != req.session.userID){
							var r = Math.random();
							if(r < 1.3/3.0)
							{
								question.fn.push({name : data[i].tags[j].name, id : data[i].tags[j].id} );
							}
							else if(r < 2.6/3.0)
								question.fy.push({name : data[i].tags[j].name, id : data[i].tags[j].id} );
							// else{
							// 	question.fy.push({name : data[i].tags[j].name, id : data[i].tags[j].id});
							// }
						}
					}
					Qs.push(question);
				}
				function insert2db (n, err, callback) {
		    		if(n < 0)
		    			return callback(err);
		    		db.votes.find({voter: req.session.userID, fn : Qs[n].fn, fy : Qs[n].fy}, function (err, data2) {
		    			if (err || data2.length == 0) {
		    				Qs[n].qid = db.ObjectId();
		    				db.votes.insert({voter: req.session.userID, fn : Qs[n].fn, fy : Qs[n].fy, _id: Qs[n].qid, yCount: 0, nCount: 0}, function (err2) {
			    					return insert2db(n-1, err2, callback);
		    				});
		    			}
		    			else {
		    				Qs[n].qid = db.ObjectId();
		    				return insert2db(n-1, err, callback);
		    			}
		    		});
		    	}
		    	return insert2db (Qs.length-1, null, function (err) {
			    		if(err){
			    			res.render('error', {error: "There are some problems."});
			    		}
			    		else{
			    			return callback(data[i], Qs);
			    		}
			    	});
				// db.votes.insert(Qs);
				// return callback(data[i], Qs);
			}
		}
		return callback2();
	});
}

app.get('/finish', function (req, res) {
	res.render('done' ,{title: 'Done', body : 'Thank\'s for your participation :)'});
});

app.get('/vote', function (req, res) {
	if(req.query.id){

		db.pictures.findOne({picID: req.query.id}, function (err3, data3) {
			if(data3) {
				var flag = false;
				for (var i = data3.votes.length - 1; i >= 0; i--) {
					if(data3.votes[i].userID == req.session.userID)
						flag = true;
				}
				if(!flag) {
					db.pictures.update({picID: req.query.id}, {$push: {votes: {userID: req.session.userID, vote: true}}}, function (err2, data2) {
						for(xxx in req.query) {
							if(xxx.substring(0, 1) == 'V'){
								if(req.query[xxx] == 'y')
									db.votes.update({_id: db.ObjectId(xxx.substring(2))}, {$inc: {yCount: 1}});
								else if(req.query[xxx] == 'n')
									db.votes.update({_id: db.ObjectId(xxx.substring(2))}, {$inc: {nCount: 1}});
							}
						}
						getNextPic(req, res, function (d, q) {
							return res.render('vote2', {title: 'vote', picture: d, questions: q, userID : req.session.userID });
						}, function () {
							res.render('done' ,{title: 'Done', body : 'It\'s finished, Thank You! :)'});
						});
					});
				}
				else {
					getNextPic(req, res, function (d, q) {
						return res.render('vote2', {title: 'vote', picture: d, questions: q, userID : req.session.userID});
					}, function () {
						res.render('done' ,{title: 'Done', body : 'It\'s finished, Thank You! :)'});
					});
				}
			}
			else {
				getNextPic(req, res, function (d, q) {
					return res.render('vote2', {title: 'vote', picture: d, questions: q, userID : req.session.userID});
				}, function () {
					res.render('done' ,{title: 'Done', body : 'It\'s finished, Thank You! :)'});
				});
			}
		});
	}
	else {
		getNextPic(req, res, function (d, q) {
			return res.render('vote2', {title: 'vote', picture: d, questions: q, userID : req.session.userID});
		}, function () {
			res.render('done' ,{title: 'Done', body : 'You don\'t have any pictures left. Thanks for your time :)'});
		});
	}
});

app.get(appData.resetURL, function (req, res) {
	db.pictures.drop(function (err) {
		db.votes.drop(function (err2) {
			res.redirect('/start');
		});
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
