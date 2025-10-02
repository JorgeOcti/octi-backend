#!/bin/bash


container=$1

docker cp ~/Downloads/osaProd $container:/

docker exec -it $container mongorestore --gzip --username osacontrol --password osacontrol --db osaAndesProduction --authenticationDatabase=admin /osaProd

docker exec -it $container rm -r /osaProd
