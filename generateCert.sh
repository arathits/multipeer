./cryptogen generate --config=crypto-config.yaml --output ./crypto-config
./configtxgen -profile SupplychainOrdererGenesis -outputBlock ./config/genesis.block
./configtxgen -profile SupplychainChannel -outputCreateChannelTx ./config/channel.tx -channelID "supplychannel"
