var mongojs = require('mongojs');
var db = mongojs('WTBass', ['pictures', 'votes', 'users']);




// db.pictures.find({}, function (err, data) {
		// for (var i = data.length - 1; i >= 0; i--) {
		// 	if(data[i].votes.length == 3)
		// 		console.log(data[i].votes.length + " " + data[i].pic);
		// 		for (var j = data[i].votes.length - 1; j >= 0; j--) {
		// 			console.log("U: " + data[i].votes[j].userID);
		// 		};
		// };
// 	});


// db.users.distinct("data.name", function(err, data) {
// 	for (var i = data.length - 1; i >= 0; i--) {
// 		console.log("Name: " + data[i].data[0].name + " " + data[i].data[0].id);
// 	}
// });

// db.pictures.find( { $where: "this.votes.length > 3" }, function(err, data){
// 		// db.votes.find({}, function(vErr, vData){
// 		// 	for (var i = vData.length - 1; i >= 0; i--) {
// 		// 		if(vot)
// 		// 	}
// 		// });
// 		for (var i = data.length - 1; i >= 0; i--) {
// 			for (var j = data[i].votes.length - 1; j >= 0; j--) {

// 				// var qq = data[i];
				
// 				// console.log("Q " + j);
// 				// db.users.findOne({ data : {$elemMatch : {id : data[i].votes[j].userID }}}, function(err2, data2){
// 				// 	// console.log("Err: " + err2);
// 				// 	console.log("U: " + qq.picID   + " " + data2.data[0].name);
// 				// 	// data2.data.forEach(console.log);
					
// 				// });
// 			};
// 		};
// } );

var arr = []

function logVote(id){
	db.votes.find( { "fn.id" : { $all: [id] }, yCount : { $gt : 0} } ).count(function (e, yCount) {
      db.votes.find( { "fn.id" : { $all: [id] }, nCount : { $gt : 0} } ).count(function (e2, nCount) {
      	db.pictures.find( { "users" : { $all: [id] }}).count(function (e2, pCount) {
      		// var tt : float = yCount
      arr.push( {id : id , val : (((yCount.toFixed(3))- nCount)/pCount)});
      // console.log("Y: " + id + " " + (((yCount.toFixed(3))- nCount)/pCount));
      // return pCount;
  	});
    });
  });
}



db.users.distinct("data.id" , function(err, data){
	for (var i = data.length - 1; i >= 0; i--) {
		logVote(data[i]);
		// console.log( i + " " +data[i]);
		// console.log( i + " " + data[i] + " " + db.votes.find( { "fn.id" : { $all: [data[i]] } } ).count(function (e, count) {
  //     console.log(count);
  //     return count;
  //   }));
	};

});


while(arr.length > 50)
{
	for (var i = arr.length - 1; i >= 0; i--) {
		console.log("Q " + arr[i]);
	};
}
