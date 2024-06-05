#!/bin/bash

LISTENPORT="${PORT:-3000}"
sed -i "s/listen\s*8080;/listen $LISTENPORT;/" /etc/nginx/conf.d/default.conf

VITE_BACKEND_URL=$MANAGER_URL yarn build && \
  cp -r /app/dist/* /usr/share/nginx/html/ && \
  nginx -g 'daemon off;'
