.PHONY: compose gateway

start:
	docker-compose up -d && docker-compose logs --no-log-prefix -f backend

restart:
	docker-compose down && docker-compose up -d && docker-compose logs --no-log-prefix -f backend

build:
	go build -o /usr/local/bin/cluster-services  && cluster-services
