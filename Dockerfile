# Verified with http://hadolint.lukasmartinelli.ch/
FROM node:8.9.1 as builder

WORKDIR /frontend

RUN npm install -g gulp
RUN npm link gulp

RUN npm install -g webdriver-manager
RUN webdriver-manager update --standalone --versions.chrome 2.28 --gecko false

RUN curl -o- -L https://yarnpkg.com/install.sh | bash

COPY package.json /frontend
RUN yarn install

COPY . /frontend

RUN gulp build

WORKDIR /frontend/app/v3/
RUN yarn global add react-scripts-ts
RUN yarn global add typescript
RUN yarn install
RUN yarn --max-old-space-size=4000 build


FROM nginx:1.13.0-alpine

MAINTAINER arnaud.jutzeler@chuv.ch

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

ENV DOCKERIZE_VERSION=v0.6.0

RUN apk add --no-cache --update ca-certificates wget openssl bash \
    && update-ca-certificates \
    && wget -O /tmp/dockerize.tar.gz "https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-${DOCKERIZE_VERSION}.tar.gz" \
    && tar -C /usr/local/bin -xzvf /tmp/dockerize.tar.gz \
    && rm -rf /var/cache/apk/* /tmp/*

# Remove Nginx configuration that will be generated by templates
RUN rm -f /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Add nginx config
COPY ./docker/runner/conf/nginx.conf.tmpl \
     ./docker/runner/conf/proxy.conf.tmpl \
     ./docker/runner/conf/gzip.conf.tmpl \
     ./docker/runner/conf/portal-backend-upstream.conf.tmpl \
     ./docker/runner/conf/config.json.tmpl \
         /portal/conf/

COPY docker/runner/run.sh /

# Add front end resources
# COPY ./dist/ /usr/share/nginx/html/
COPY --from=builder /frontend/dist /usr/share/nginx/html/
COPY --from=builder /frontend/app/v3/build /usr/share/nginx/html/v3/

# Protected files folder
ENV PROTECTED_DIR /protected
RUN mkdir ${PROTECTED_DIR} \
	&& chown -R nginx:nginx ${PROTECTED_DIR}
VOLUME [${PROTECTED_DIR}]

EXPOSE 80 443

ENTRYPOINT ["/run.sh"]

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="hbpmip/portal-frontend" \
      org.label-schema.description="Nginx server configured to serve the frontend of the MIP portal" \
      org.label-schema.url="https://mip.humanbrainproject.eu" \
      org.label-schema.vcs-type="git" \
      org.label-schema.vcs-url="https://github.com/LREN-CHUV/portal-frontend" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.version="$VERSION" \
      org.label-schema.vendor="LREN CHUV" \
      org.label-schema.license="AGPLv3" \
      org.label-schema.docker.dockerfile="Dockerfile" \
      org.label-schema.memory-hint="10" \
      org.label-schema.schema-version="1.0"
