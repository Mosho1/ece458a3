set -e

export EMAIL_ACCOUNT="ece458a3@gmail.com"
export EMAIL_PASSWORD=$(pass Email/ece458a3)

docker build . --tag a3 -m 500m
docker run -ti -p 3001:3001 a3 -e EMAIL_ACCOUNT=$EMAIL_ACCOUNT -e EMAIL_PASSWORD=$EMAIL_PASSWORD
