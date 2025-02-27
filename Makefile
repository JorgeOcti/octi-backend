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
	rm -rf node_modules
	rm -rf public/js/app/node_modules


# It builds all the services
build: hashCompare
	docker compose build --no-cache
	$(MAKE) startBackend
	docker compose cp backend:/srv/node_modules ./
	$(MAKE) stopBackend
	$(MAKE) startFrontend
	docker compose cp frontend:/srv/public/js/app/node_modules ./public/js/app/
	$(MAKE) stopFrontend


# It stops all the services runing or a specific one
stopMongo:
	docker compose down mongo

stopBackend:
	docker compose down backend

stopRedis:
	docker compose down Redis

stopFrontend:
	docker compose down frontend

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
	docker compose logs --no-log-prefix backend --follow

logsFrontend:
	docker compose logs --no-log-prefix frontend --follow

logs:
	docker compose logs backend frontend --follow

typescriptCheck: stopBackend
	$(MAKE) startBackend
	docker compose exec backend tsc --project tsconfig.json
	$(MAKE) stopBackend

# It helps to configure the git remotes and the load of the dump for the database

gitRemote:
	./setGit.sh

dumpLoad: dump stopMongo
	$(MAKE) startMongo
	./dataLoad.sh $(CURDIR)-mongo-1
	$(MAKE) stopMongo

workflow: gitRemote dumpLoad
