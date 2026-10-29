FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# React 18.3's safelyCallDestroy calls the effect cleanup unguarded, so a
# non-function `destroy` crashes the commit phase. Matched by shape, not by
# minified name: the old name-based pattern silently stopped matching once the
# build started using package-lock.json.
RUN npm run build && \
  sed -i 's/try{\([a-zA-Z0-9_$]*\)()}catch(/try{typeof \1!="function"||\1()}catch(/g' dist/assets/index-*.js

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
