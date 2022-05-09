FROM node:16.14.2-bullseye-slim
MAINTAINER Gonzalo Muñoz Coloma gmunoz@osacontrol.com
# phantom node 16 fix
ENV OPENSSL_CONF=/dev/null

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cabextract \
        wget \
        xfonts-utils \
        ca-certificates \
        fontconfig \
        libfreetype6 \
        libfontconfig1 \
        libssl-dev \
        libxft-dev \
        python3 \
        graphicsmagick \
        gettext \
        git-core \
        imagemagick && \
    # install windows fonts
    wget http://ftp.br.debian.org/debian/pool/contrib/m/msttcorefonts/ttf-mscorefonts-installer_3.8_all.deb && \
    dpkg -i ttf-mscorefonts-installer_3.8_all.deb && \
    fc-cache && \
    # install phantomjs
    PHANTOM_JS="phantomjs-2.1.1-linux-x86_64" && \
    wget https://bitbucket.org/ariya/phantomjs/downloads/$PHANTOM_JS.tar.bz2 && \
    tar -xvjf $PHANTOM_JS.tar.bz2 && \
    mv $PHANTOM_JS /usr/local/share && \
    ln -s /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin && \
    # clean
    apt-get clean && \
    rm -rf /var/lib/apt

WORKDIR /srv

COPY ./package.json /srv/package.json

RUN export PYTHON=python3
RUN npm --unsafe-perm --production install && \
    npm i -g pm2 typescript && \
    touch /srv/s3-config.json && \
    echo "{}" >> /srv/s3-config.json && \
    touch /srv/ses-config.json && \
    echo "{}" >> /srv/ses-config.json

COPY ./src /srv/src
COPY ./public /srv/public
COPY ./views /srv/views
COPY ./pm2.json /srv/pm2.json
COPY ./tsconfig.json /srv/tsconfig.json

RUN npm i

RUN tsc --project tsconfig.json

RUN rm -rf /srv/src

EXPOSE 3000

CMD [ "pm2", "start", "pm2.json", "--no-daemon" ]
