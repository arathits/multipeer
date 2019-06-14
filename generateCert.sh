#Cryptographic materials are created using cryptogen tool and placed in crypto-config folder.
#Consumes crypto-config.yaml file ad input
#This include certificates for each peer in the organisation
./cryptogen generate --config=crypto-config.yaml --output ./crypto-config

#Generate genesis block and channel configuration as specified in configtx.yaml file
./configtxgen -profile SupplychainOrdererGenesis -outputBlock ./config/genesis.block
./configtxgen -profile SupplychainChannel -outputCreateChannelTx ./config/channel.tx -channelID "supplychannel"
