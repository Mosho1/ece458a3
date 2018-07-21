set -e

export EMAIL_ACCOUNT="ece458a3@gmail.com"
export EMAIL_PASSWORD=$(cat /tmp/ece458a3)

docker build . --tag a3 -m 500m --rm
docker run -p 3001:3001 -e EMAIL_ACCOUNT=$EMAIL_ACCOUNT -e EMAIL_PASSWORD=$EMAIL_PASSWORD -e NODE_ENV="production" a3
