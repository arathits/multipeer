module.exports={
func:function(uname, utype, response){
'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

//
var fabric_client = new Fabric_Client();

var user_name = uname;
var user_type = utype;
console.log("Username = " + user_name);
console.log("Usertype = " + user_type);

// setup the fabric network
var channel = fabric_client.newChannel('supplychannel');

var peer;
if (user_type == 'distributer'){
	peer = fabric_client.newPeer('grpc://localhost:8051');
} else if (user_type == 'supplier'){
	peer = fabric_client.newPeer('grpc://localhost:7056');
} else if (user_type == 'admin'){
	peer = fabric_client.newPeer('grpc://localhost:7051');
}

channel.addPeer(peer);
//init js file out


//
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

	// queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
	// queryAllCars chaincode function - requires no arguments , ex: args: [''],
	const request = {
		//targets : --- letting this default to the peers assigned to the channel
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
				arr2 = arr[i].split(" ");
				console.log("\tId = "+arr2[0]);
				console.log("\tType = "+arr2[1]);
				console.log("\tName = "+arr2[2]);
				console.log("\tQuantity = "+arr2[3]);
				console.log("\tOwner = "+arr2[4]);
				console.log("\tCurrent Owner = "+arr2[5]);
				console.log("\tAddress = "+arr2[6]);
			}
			//console.log(query_responses[0].toString());
			response.render('adminHome.pug', {queryresult: str, uname: user_name, sname: user_name});
			//response.end(query_responses[0].toString());
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
