docker-compose down
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)

rm -rf hfc-key-store
rm -f supplychain.1.0
rm -f supplychannel.block
rm -f ./newjsfiles/login.txt
