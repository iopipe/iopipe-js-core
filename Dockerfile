FROM mhart/alpine-node:8

WORKDIR /app

RUN npm install -g yarn

COPY . .

RUN yarn
RUN yarn test
