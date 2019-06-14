# Stop and remove network

# Stop and remove all docker containers
docker-compose down

# Remove all docker images
docker rm $(docker ps -aq)

# Remove chaincode container image
docker rmi $(docker images dev-* -q)

#Remove files and folders created during network setup
rm -rf hfc-key-store
rm -f supplychain.1.0
rm -f supplychannel.block
rm -f ./newjsfiles/login.txt
