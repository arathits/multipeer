// nodejs program to get the total no of blocks and all its details
module.exports={
func:function func(uname, utype, response){

'use strict';

// load required modules
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

var promises = [];
var str=" ";
var arr = [];
var hgt;
var fabric_client = new Fabric_Client();

var user_type = utype;
var user_name = uname;
console.log("Username = " + user_name);

// setup the fabric network
// create a channel object
var channel = fabric_client.newChannel('supplychannel');
var peer;
if (user_type == 'distributer'){
	peer = fabric_client.newPeer('grpc://localhost:8051');
} else if (user_type == 'supplier'){
	peer = fabric_client.newPeer('grpc://localhost:7056');
} else if (user_type == 'admin'){
	peer = fabric_client.newPeer('grpc://localhost:7051');
}

// find type of peer and return a peer object with appropriate url
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

	// query for various useful information on the state of the Channel (block height, known peers,etc)
	return channel.queryInfo();
}).then((blockinfo) => {
	console.log("Query has completed, checking results");
	// query_responses could have more than one results
	if (blockinfo) {
		if (blockinfo[0] instanceof Error) {
			console.error("error from query = ", blockinfo[0]);
		} else {
			//get block height
			console.log('Block Height='+blockinfo.height.low);
			hgt = blockinfo.height.low.toString();
			arr.length=hgt;

			var i;
			// loop through array of promises, to call a local function named getBlock()
			for(i=0;i<hgt;i++)
			{
  				promises.push(getBlock(i));
			}
			console.log(arr);

			// when all promises are resolved
			Promise.all(promises)
    		.then(() => {
				console.log(arr);
				// render results to a pug file
	        		response.render('dispblocks.pug',{uname: user_name, height: hgt, strs:arr.toString()});
    		})
    		.catch((e) => {
        		console.log(err)
    		});
		}
	}
	else {
		console.log("No payloads were returned from query");
	}
}).catch((err) => {
	console.error('Failed to query successfully :: ' + err);
})


// function to get each block's details
var getBlock = function(bid){
	return new Promise((resolve) => {
	// query the ledger for Block details by block number.
	channel.queryBlock(bid).then((block) => {
		var ans = calculateBlockHash(block.header); //call to user-defined function calculateBlockHash

		str = "Block Number : " + block.header.number.toString() + "<br>Current Hash : " + ans.toString()+"<br>Previous Hash: "+block.header.previous_hash.toString()+"<br>Data Hash : "+block.header.data_hash.toString()+"<br>Transactions:"+ block.data.data.length.toString();

		// append the details to array
		arr[bid]=str;
		console.log(bid);
		// check the results
	}, (err) => {
		console.log('Failed to send install proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send install proposal due to error: ' + err.stack ? err.stack : err);
	});
	setTimeout(() => {
    console.log("Resolving " + bid);
    resolve(bid);
  }, 1000);
});
}


// modules required to calculate hash
var sha = require('js-sha256');
var asn = require('asn1.js');
// function to get current block's hash
var calculateBlockHash = function(header) {
  let headerAsn = asn.define('headerAsn', function() {
		// current hash is calculated from block number, previous block hash and current block's data hash
    this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
     	this.key('DataHash').octstr()
   	);
 	});
	// find current block hash
  let output = headerAsn.encode({
      Number: parseInt(header.number),
      PreviousHash: Buffer.from(header.previous_hash, 'hex'),
      DataHash: Buffer.from(header.data_hash, 'hex')
  }, 'der');
  let hash = sha.sha256(output);
  return hash;
};

}
}
