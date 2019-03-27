FROM node:10.15.3-stretch-slim
MAINTAINER Gonzalo Muñoz Coloma gmunoz@osacontrol.com

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cabextract \
        xfonts-utils \
        fontconfig \
        libfontconfig1 \
        python \
        graphicsmagick \
        gettext \
        imagemagick && \
    wget http://ftp.br.debian.org/debian/pool/contrib/m/msttcorefonts/ttf-mscorefonts-installer_3.7_all.deb && \
    dpkg -i ttf-mscorefonts-installer_3.7_all.deb && \
    fc-cache && \
    rm -rf /var/lib/apt

WORKDIR /srv

COPY ./package.json /srv/package.json

RUN npm --unsafe-perm --production install  && \
    npm i -g pm2 && \
    touch /srv/s3-config.json && \
    echo "{}" >> /srv/s3-config.json && \
    touch /srv/ses-config.json && \
    echo "{}" >> /srv/ses-config.json

COPY ./dist /srv/dist
COPY ./public /srv/public
COPY ./views /srv/views
COPY ./pm2.json /srv/pm2.json

EXPOSE 3000

CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]
