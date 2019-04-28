module.exports={
func:function func(uname, utype, response){

'use strict';
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
console.log("process.argv = " + user_name);

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
	// query_responses could have more than one results if there multiple peers were used as targets
	if (blockinfo) {
		if (blockinfo[0] instanceof Error) {
			console.error("error from query = ", blockinfo[0]);
		} else {
			console.log('Block Height='+blockinfo.height.low);
			hgt = blockinfo.height.low.toString();
			arr.length=hgt;
			console.log("hello");
			var i;
			for(i=0;i<hgt;i++)
			{
  				promises.push(getBlock(i));
			}
			console.log("world");
			console.log(arr);	

			Promise.all(promises)
    		.then(() => {
				console.log("world");
				console.log(arr);	
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
	//response.writeHead(200, {'Content-Type': 'text/html'});
	//response.write('Failed to get execute with this supplier.... run registerUser.js');
})


//function to get each block's details
var getBlock = function(bid){
	return new Promise((resolve) => {
	
	channel.queryBlock(bid).then((block) => {
		var ans = calculateBlockHash(block.header);

		/*console.log("Block : ", block.header.number);
		console.log("==========");
		console.log("Current Hash : ",ans);
		console.log("Previous Hash: ", block.header.previous_hash);
		console.log("Data Hash : ", block.header.data_hash);
		console.log('Transactions: ' + block.data.data.length);*/
		str = "Block Number : " + block.header.number.toString() + "<br>Current Hash : " + ans.toString()+"<br>Previous Hash: "+block.header.previous_hash.toString()+"<br>Data Hash : "+block.header.data_hash.toString()+"<br>Transactions:"+ block.data.data.length.toString();
			
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


//function to get current block's hash
var sha = require('js-sha256');
var asn = require('asn1.js');
var calculateBlockHash = function(header) {
  let headerAsn = asn.define('headerAsn', function() {
    this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
     this.key('DataHash').octstr()
   );
 });

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

