docker-compose down
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)
