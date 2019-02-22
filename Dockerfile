FROM node:9.11-alpine
# FROM node:9.11-jessie

LABEL maintainer = "gmunoz@osacontrol.com"

# create directories
RUN mkdir -p /srv/app
RUN mkdir -p /srv/logs
RUN mkdir -p /srv/public
RUN mkdir -p /srv/views

WORKDIR /srv/app

# copy files and directories
COPY ./dist/ ./
COPY ./views/ ../views
COPY ./public/ ../public
COPY ./.env ../
COPY ./ses-config.json ../
COPY ./s3-config.json ../
COPY ./package.json ./

# install requirements
# RUN apt-get update && apt-get upgrade -y && apt-get install -y python

RUN apk add --no-cache make gcc g++ python && \
  npm --unsafe-perm install && \
  apk del make gcc g++ python



# install node packages
# RUN npm  --unsafe-perm  install

# port to expose
EXPOSE 3000

# CMD pm2 start --no-daemon  pm2.json

# run app
CMD ["node", "server.js"]
