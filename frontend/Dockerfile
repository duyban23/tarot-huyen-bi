FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && \
  sed -i 's/function ll(e,n,s){try{s()}catch(a){De(e,n,a)}}/function ll(e,n,s){try{typeof s==="function"\&\&s()}catch(a){De(e,n,a)}}/g' dist/assets/index-*.js

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
