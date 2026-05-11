FROM node:20-alpine

WORKDIR /app

COPY services/api-gateway/package.json /app/package.json

RUN npm install

COPY services/api-gateway/src /app/src

CMD ["npm", "start"]

