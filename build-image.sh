#!/usr/bin/env bash
# https://cloud.google.com/container-registry/docs/advanced-authentication
docker build -t $DOCKER_ID_USER/osa-andes:latest -t $DOCKER_ID_USER/osa-andes:1.0.3 -t gcr.io/durable-timing-221813/osa-andes:latest -t gcr.io/durable-timing-221813/osa-andes:1.0.3 . && docker push gcr.io/durable-timing-221813/osa-andes

# kubectl expose deployment redis --type NodePort --port 6379 --target-port 6379
