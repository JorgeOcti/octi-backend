FROM node:9.11-alpine

LABEL maintainer = "gmunoz@osacontrol.com"

WORKDIR /srv

COPY . /srv

# install requirements
RUN apk add --no-cache make gcc g++ python && \
  npm --unsafe-perm install && \
  apk del make gcc g++ python

# install node packages
# RUN npm  --unsafe-perm  install
# RUN npm i -g pm2

# port to expose
RUN npm run build


EXPOSE 3000

# run app
# CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]
# run watch app
# CMD ["npm", "run", "watch-ts"]
CMD ["node", "dist/server.js"]