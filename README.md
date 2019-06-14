# **Supplychain for Disaster Management using Blockchain**

## **INSTALLATION OF HYPERLEDGER FABRIC**

### **Pre-requisites**
	Require Ubuntu 14.04 LTS or 16.04 LTS operating system
	Install the follwing:
	1 Download golang for linux from https://golang.org (version required 1.11.x)
		- Extract files
			$ tar -xvf go1.11.x.linux-amd64.tar.gz (replace x with the version number)
		- Run following commands in $HOME
			$ mkdir go/src/
			$ export GOPATH=$HOME/go
			$ export PATH=$PATH:$GOPATH/bin

	2 Install nodejs from https://nodejs.org/en/download/ (version required 8.x)
		npm will be installed along with nodejs. Check version of npm `npm version` (version required 5.6.0)
		To downgrade npm `npm install -g npm@5.6.0`

	3 Install git
		$ sudo apt-get install git

	4 Install docker and docker-compose
		Docker version 17.06.2-ce or greater is required
		Docker Compose version 1.8.0 or greater is required
		$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
		$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
		$ sudo apt-get update
		$ sudo apt-get install -y docker-ce

### **Install binaries and docker images**
	curl -sSL http://bit.ly/2ysbOFE | bash -s



## **BLOCKCHAIN NETWORK SETUP AND RUNNING APPLICATION**

The application development include 3 steps

	1 Network setup
	2 Chaincode development
	3 Middleware development

### **Network Setup**

#### **Generate certificates and initial configuration**
	If crypto-config and config folders already exist
		- Run `rm -rf crypto-config`
		- Run `rm ./config/channel.tx`
		- Run `rm ./config/genesis.block`

	Create an empty folder named 'config'
	Run `sh generateCert.sh`
	This will create:
		- crypto-config folder and its contents
		- channel.tx and genesis.block files inside config folder

	Change filename in docker-compose file
	- Goto crypto-config/peerOrganisations/supplychainorg.project.com/ca
	- Copy filename ending with 'sk'
	- Open docker-compose.yaml file
	- Paste filename in place of existing 'sk' filename in variable FABRIC_CA_SERVER_CA_KEYFILE (under ca.project.com service)

#### **Run network setup file**
	Run `sh start.sh`
		- Create channel and join peers to channel
		- Install, instantiate and invoke chaincode

#### **To remove network**
	Run `sh clean.sh`
		- Stop and remove all containers
		- Remove local key store folder
		- Remove channel and instantiated chaincode files copied to local filesystem during network setup

### **Chaincode development**

	Chaincode functions defined and saved in ./chaincode/supplychain.go

### **Middleware development**

	Middleware files are stored in ./newjsfiles
	Webpage UI pug templates are stored in ./newjsfiles/views
	Back-end nodejs files are stores in ./newjsfiles/javascript

	To run the application, run following in terminal:
		- `cd newjsfiles/javascript`
		- `node enrollAdmin`
		- `cd ..`
		- `node supplierHome.js` (in Terminal 1)
		- `node adminHome.js` (in Terminal 2)
		- `node distHome.js` (in Terminal 3)

	Open web browser and three tabs:
	 - Tab 1: http://localhost:3000/ - Supplier Home
	 - Tab 2: http://localhost:3030/ - Admin Home
	 - Tab 3: http://localhost:3060/ - Distributer Home
