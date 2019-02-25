FROM node:9.11-jessie

LABEL maintainer = "gmunoz@osacontrol.com"

WORKDIR /srv

# install requirements
RUN mkdir -p /srv && \
    apt-get update && apt-get upgrade -y && apt-get install -y \
    python

COPY . /srv

# install node packages
RUN npm  --unsafe-perm  install
#RUN npm i typescript@3.1.6 -D

# port to expose
EXPOSE 3000

# run app
CMD ["npm", "run", "watch-ts"]
