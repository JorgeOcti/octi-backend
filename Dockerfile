FROM node:9.11-slim

LABEL maintainer = "gmunoz@osacontrol.com"

# create directories
RUN mkdir -p /srv/app
RUN mkdir -p /srv/public
RUN mkdir -p /srv/views

WORKDIR /srv/app

# copy files and directories
COPY ./dist/ ./
COPY ./views/ ../views
COPY ./public/ ../public
COPY ./.env ../
COPY ./ses-config.json ../
COPY ./package.json ./

# install node packages
RUN npm install

#run app
CMD ["node", "server.js"]
