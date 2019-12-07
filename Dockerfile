FROM node:13-alpine
WORKDIR /src/app

COPY package.json yarn.lock /src/app/
RUN yarn --production --frozen-lockfile

COPY . /src/app

ENTRYPOINT ["node", "/src/app/index.js"]