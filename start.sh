# Network Setup

# Create containers - default input is docker-compose.yaml file
docker-compose up -d

# Create channel using channel transaction file in config folder
docker exec -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@supplychainorg.project.com/msp" administrator peer channel create -o orderer.project.com:7050 -c supplychannel -f /etc/hyperledger/configtx/channel.tx

# Copy supplychannel.block to local filesystem and then to all other peer containers
docker cp administrator:/opt/gopath/src/github.com/hyperledger/fabric/peer/supplychannel.block .
docker cp supplychannel.block supplier:/opt/gopath/src/github.com/hyperledger/fabric/peer/supplychannel.block
docker cp supplychannel.block distributer1:/opt/gopath/src/github.com/hyperledger/fabric/peer/supplychannel.block
docker cp supplychannel.block distributer2:/opt/gopath/src/github.com/hyperledger/fabric/peer/supplychannel.block

export CC_SRC_PATH=github.com

echo "***********************************************JOIN CHANNEL***********************************************"
# Join all peers to supplychannel

docker exec -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@supplychainorg.project.com/msp" administrator peer channel join -b supplychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@supplychainorg.project.com/msp" supplier peer channel join -b supplychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@supplychainorg.project.com/msp" distributer1 peer channel join -b supplychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@supplychainorg.project.com/msp" distributer2 peer channel join -b supplychannel.block

echo "***********************************************CHAINCODE INSTALL***********************************************"
# Install chaincode on all peers

docker exec -e "CORE_PEER_ADDRESS=administrator.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode install -n supplychain -v 1.0 -p "$CC_SRC_PATH"

docker exec -e "CORE_PEER_ADDRESS=supplier.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode install -n supplychain -v 1.0 -p "$CC_SRC_PATH"

docker exec -e "CORE_PEER_ADDRESS=distributer1.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode install -n supplychain -v 1.0 -p "$CC_SRC_PATH"

docker exec -e "CORE_PEER_ADDRESS=distributer2.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode install -n supplychain -v 1.0 -p "$CC_SRC_PATH"

echo "***********************************************CHAINCODE INSTANTIATE***********************************************"
# Instantiate chaincode on channel (use any peer addredd)

docker exec -e "CORE_PEER_ADDRESS=distributer1.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode instantiate -o orderer.project.com:7050 -C supplychannel -n supplychain -v 1.0 -c '{"Args":[""]}' -P "OR ('SupplychainMSP.member')"

sleep 5

# Copy chaincode instatiated file to all peer containers
docker cp administrator:/var/hyperledger/production/chaincodes/supplychain.1.0 .
docker cp supplychain.1.0 supplier:/var/hyperledger/production/chaincodes/supplychain.1.0
docker cp supplychain.1.0 distributer1:/var/hyperledger/production/chaincodes/supplychain.1.0
docker cp supplychain.1.0 distributer2:/var/hyperledger/production/chaincodes/supplychain.1.0

echo "***********************************************CHAINCODE INVOKE***********************************************"
# Invoke initLedger function of chaincode

docker exec -e "CORE_PEER_ADDRESS=administrator.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode invoke -o orderer.project.com:7050 -C supplychannel -n supplychain -c '{"function":"initLedger","Args":[""]}'

docker exec -e "CORE_PEER_ADDRESS=supplier.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode invoke -o orderer.project.com:7050 -C supplychannel -n supplychain -c '{"function":"initLedger","Args":[""]}'

docker exec -e "CORE_PEER_ADDRESS=distributer1.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode invoke -o orderer.project.com:7050 -C supplychannel -n supplychain -c '{"function":"initLedger","Args":[""]}'

docker exec -e "CORE_PEER_ADDRESS=distributer2.supplychainorg.project.com:7051" -e "CORE_PEER_LOCALMSPID=SupplychainMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/supplychainorg.project.com/users/Admin@supplychainorg.project.com/msp" cli peer chaincode invoke -o orderer.project.com:7050 -C supplychannel -n supplychain -c '{"function":"initLedger","Args":[""]}'
