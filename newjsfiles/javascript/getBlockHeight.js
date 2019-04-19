module.exports={
func:function(uname, response){
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
console.log("process.argv = " + user_name);

// setup the fabric network
var channel = fabric_client.newChannel('supplychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
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

	// send the query proposal to the peer
	return channel.queryInfo();
}).then((blockinfo) => {
	console.log("Query has completed, checking results");
	// query_responses could have more than one  results if there multiple peers were used as targets
	if (blockinfo) {
		if (blockinfo[0] instanceof Error) {
			console.error("error from query = ", blockinfo[0]);
		} else {
			console.log('Block Height='+blockinfo.height.low);
			var str = blockinfo.height.low.toString();
			response.render('dispblocks.pug',{uname: user_name, height: str });
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
