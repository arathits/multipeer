// nodejs function to query all product details and their owners
module.exports={
func:function(uname, utype, response){
'use strict';

// load required modules
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');


var fabric_client = new Fabric_Client();

var user_name = uname;
var user_type = utype;
console.log("Username = " + user_name);
console.log("Usertype = " + user_type);

// setup the fabric network
// create a channel object
var channel = fabric_client.newChannel('supplychannel');
// find type of peer and return a peer object with appropriate url
var peer;
if (user_type == 'distributer'){
	peer = fabric_client.newPeer('grpc://localhost:8051');
} else if (user_type == 'supplier'){
	peer = fabric_client.newPeer('grpc://localhost:7056');
} else if (user_type == 'admin'){
	peer = fabric_client.newPeer('grpc://localhost:7051');
}
// add the peer object to the channel object
channel.addPeer(peer);

var member_user = null;
var store_path = path.join(__dirname, '../../hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
	// assign the store to the fabric client
	fabric_client.setStateStore(state_store);
	var crypto_suite = Fabric_Client.newCryptoSuite();
	// use the same location for the state store (where the users' certificate are kept)
	// and the crypto store (where the users' keys are kept)
	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

	// get the enrolled user from persistence, this user will sign all requests
	return fabric_client.getUserContext(user_name, true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log('Successfully loaded '+user_name+' from persistence');
		member_user = user_from_store;
	} else {
		throw new Error('Failed to get '+user_name+'.... run registerUser.js');
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write('Failed to get '+user_name+'.... run registerUser.js');
	}

	const request = {
		chaincodeId: 'supplychain',
		fcn: 'queryAllProducts',
		args: [''],
	};

	// send the query proposal to the peer

	return channel.queryByChaincode(request);
}).then((query_responses) => {
	console.log("Query has completed, checking results");
	// query_responses could have more than one  results if there multiple peers were used as targets
	if (query_responses && query_responses.length == 1) {
		if (query_responses[0] instanceof Error) {
			console.error("error from query = ", query_responses[0]);
		} else {
			var str = query_responses[0].toString();
			var arr = [];
			var arr2 = [];
			arr = str.split(".");
			for (var i = 0; i < arr.length-1; i++) {
			  // displaying the results on console
				arr2 = arr[i].split(" ");
				console.log("\tId = "+arr2[0]);
				console.log("\tType = "+arr2[1]);
				console.log("\tName = "+arr2[2]);
				console.log("\tQuantity = "+arr2[3]);
				console.log("\tOwner = "+arr2[4]);
				console.log("\tCurrent Owner = "+arr2[5]);
				console.log("\tAddress = "+arr2[6]);
			}
			// displaying in web UI
			response.render('adminHome.pug', {queryresult: str, uname: user_name, sname: user_name});

		}
	} else {
		console.log("No payloads were returned from query");
	}
}).catch((err) => {
	console.error('Failed to query successfully :: ' + err);
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write('Failed to get execute with this supplier.... run registerUser.js');
})
}
}
