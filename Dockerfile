FROM node:9.11-alpine

LABEL maintainer = "gmunoz@osacontrol.com"

WORKDIR /srv

COPY . /srv

# install requirements
RUN apk add --no-cache make gcc g++ python graphicsmagick imagemagick && \
  npm --unsafe-perm install && \
  apk del make gcc g++ python

RUN npm i -g pm2

# port to expose
RUN npm run build

RUN touch s3-config.json
RUN echo "{}" >>s3-config.json
RUN touch ses-config.json
RUN echo "{}" >>ses-config.json

EXPOSE 3000

# run app

# run watch app
# CMD ["npm", "run", "watch-ts"]
# CMD ["node", "dist/server.js"]
CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]