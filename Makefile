.PHONY: hashCompare cleanMongo cleanRedis cleanBackend clean build stopMongo stopBackend stopRedis stopFrontend stop startBackend startMongo startRedis startFrontend start logsBackend logsFrontend logs gitRemote dumpLoad workflow

CURDIR = $(notdir $(PWD))

# Hash check of the package.json file
.packageHash:
	./hashGenerate.sh

hashCompare: .packageHash
	./hashCompare.sh


# Cleaning all labeled volumes and data or some ones especific
cleanMongo:
	docker volume rm $(CURDIR)_mongo -f
	docker volume rm $(CURDIR)_mongoConf -f

cleanRedis:
	docker volume rm $(CURDIR)_redis -f

cleanBackend:
	docker volume rm $(CURDIR)_backend-modules -f

clean: cleanMongo cleanRedis cleanBackend
	docker compose down --volumes


# It builds all the services
build: hashCompare
	docker compose build --no-cache


# It stops all the services runing or a specific one
stopMongo:
	docker compose down mongo

stopBackend:
	docker compose down backend

stopRedis:
	docker compose down Redis

stopFrontend:
	docker compose down fronend

stop:
	docker compose down


# It starts all the services or a specific one all in daemon mode
startMongo: stopMongo
	docker compose up mongo -d

startBackend: stopBackend
	docker compose up backend -d

startRedis: stopRedis
	docker compose up redis -d

startFrontend: stopFrontend
	docker compose up frontend -d

start: stop
	docker compose up -d


# It conects the output of the frontend and backend service or one of them without the prefix
logsBackend:
	docker compose logs --no-log-prefix backend

logsFrontend:
	docker compose logs --no-log-prefix frontend

logs:
	docker compose logs backend frontend

# It helps to configure the git remotes and the load of the dump for the database

gitRemote:
	./setGit.sh

dumpLoad: dump stopMongo
	$(MAKE) startMongo
	./dataLoad.sh $(CURDIR)-mongo-1
	$(MAKE) stopMongo

workflow: gitRemote dumpLoad
