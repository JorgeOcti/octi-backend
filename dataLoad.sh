#!/bin/bash


container=$1

docker cp dump $container:/

docker exec -it $container mongorestore --gzip --username osacontrol --password osacontrol --db osaAndesProduction --authenticationDatabase=admin /dump

docker exec -it $container rm -r /dump
