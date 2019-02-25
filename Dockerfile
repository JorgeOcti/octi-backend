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
# RUN npm i -g pm2

# port to expose
EXPOSE 3000

# run app
# CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]
# run watch app
CMD ["npm", "run", "watch-ts"]
