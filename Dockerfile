FROM node:8

WORKDIR /tmp/code/

COPY package.json .

RUN npm i --ignore-scripts

COPY . .

RUN npm run build-browser

EXPOSE 3001

CMD ["/bin/bash"]
