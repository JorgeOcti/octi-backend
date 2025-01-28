#!/bin/bash


container=$1

docker cp dummy_data $container:/

docker exec -it $container mongorestore --gzip --username osacontrol --password osacontrol --db osaAndesProduction --authenticationDatabase=admin /dummy_data

docker exec -it $container rm -r /dummy_data
