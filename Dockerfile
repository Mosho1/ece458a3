FROM node:10

WORKDIR /tmp/code/

COPY package.json .

RUN npm i

COPY . .


RUN npm run build-browser

# create db
RUN node webpack/db.js

RUN groupadd app
RUN useradd -g app app

RUN chmod 600 db.sqlite3
RUN chown app:app ../code
RUN chown app:app db.sqlite3

USER app

EXPOSE 3001

ENV EMAIL_PASSWORD ''
ENV EMAIL_ACCOUNT ''

CMD ["npm", "run", "serve"]
