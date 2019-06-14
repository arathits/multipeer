// nodejs funtion to register a new user and enroll it
module.exports={
func:function(username11,pwd11,response){
'use strict';

// load required modules
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var path = require('path');
var util = require('util');
var os = require('os');
const fs = require('fs');
var sha = require('js-sha256');

var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var store_path = path.join(__dirname, '../../hfc-key-store');

console.log('Store path:'+store_path);

var user_name = username11;
var password = sha.sha256(pwd11);

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
    var	tlsOptions = {
    	trustedRoots: [],
    	verify: false
    };
    fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', null , '', crypto_suite);

    // first check to see if the admin is already enrolled
    return fabric_client.getUserContext('admin', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
    } else {
        // if admin is not enrolled run enrollAdmin.js
        throw new Error('Failed to get admin.... run enrollAdmin.js');
    }

    // at this point we should have the admin user
    // first need to register the user with the CA server

    return fabric_ca_client.register({enrollmentID: user_name, affiliation: '',role: 'client'}, admin_user);
}).then((secret) => {
    // next we need to enroll the user with CA server
    console.log('Successfully registered ' + user_name + ' - secret:'+ secret);

    return fabric_ca_client.enroll({enrollmentID: user_name, enrollmentSecret: secret});
}).then((enrollment) => {
  console.log('Successfully enrolled member user ' + user_name);
  return fabric_client.createUser(
     {username: user_name,
     mspid: 'SupplychainMSP',
     cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
     });
}).then((user) => {
     member_user = user;
     return fabric_client.setUserContext(member_user);
}).then(()=>{
     console.log(user_name+' was successfully registered and enrolled and is ready to interact with the fabric network');
     var str = user_name+' was successfully registered';

     // append login credentials to file login.txt
	    fs.appendFileSync('login.txt', user_name+" "+password+"\r\n");
      console.log("Login credentials saved to file!");
}).catch((err) => {
    console.error('Failed to register: ' + err);
  	if(err.toString().indexOf('Authorization') > -1) {
  		console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
  		'Try again after deleting the contents of the store directory '+store_path);
  	}
});

}
}
