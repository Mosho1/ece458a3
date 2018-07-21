FROM node:10

WORKDIR /tmp/code/

COPY package.json .

RUN npm i

COPY . .

RUN npm run build-browser

RUN chmod 666 db.sqlite3

RUN useradd app
USER app

EXPOSE 3001

ENV EMAIL_PASSWORD ''
ENV EMAIL_ACCOUNT ''

CMD ["npm", "run", "serve"]
