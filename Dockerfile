FROM node:8

WORKDIR /tmp/code/

COPY package.json .

RUN npm i --ignore-scripts

COPY . .

RUN npm run build-browser

EXPOSE 3001

ENV EMAIL_PASSWORD ''
ENV EMAIL_ACCOUNT ''

CMD ["npm", "run", "serve"]
