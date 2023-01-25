FROM node:18.13.0-bullseye-slim

LABEL maintainer = "gmunoz@osacontrol.com"

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cabextract \
        wget \
        gnupg \
        chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
        xfonts-utils \
        ca-certificates \
        fontconfig \
        libfreetype6 \
        libfontconfig1 \
        libssl-dev \
        libxft-dev \
        python3 \
        nano \
        graphicsmagick \
        gettext \
        git-core \
        imagemagick && \
    # install windows fonts
    wget http://ftp.br.debian.org/debian/pool/contrib/m/msttcorefonts/ttf-mscorefonts-installer_3.8_all.deb && \
    dpkg -i ttf-mscorefonts-installer_3.8_all.deb && \
    rm ttf-mscorefonts-installer_3.8_all.deb && \
    fc-cache && \
    # clean
    apt-get clean && \
    rm -rf /var/lib/apt

# # We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

WORKDIR /srv

RUN npm install -g npm@latest

RUN npm i -g typescript ts-node ts-node-dev pm2 ts-migrate-mongoose
RUN touch /srv/s3-config.json
RUN echo "{}" >> /srv/s3-config.json
RUN touch /srv/ses-config.json
RUN echo "{}" >> /srv/ses-config.json

COPY ./package.json /srv/package.json

COPY ./src /srv/src
COPY ./public /srv/public
COPY ./views /srv/views
COPY ./pm2.json /srv/pm2.json
COPY ./tsconfig.json /srv/tsconfig.json

RUN export PYTHON=python3

RUN npm i

RUN tsc --project tsconfig.json

RUN rm -rf /srv/node_modules

RUN npm --production i && npm cache clean --force

EXPOSE 3000

CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]
