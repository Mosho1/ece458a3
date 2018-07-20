set -e

npm i
npm run build-browser -- --quiet
export EMAIL_ACCOUNT="ece458a3@gmail.com"
export EMAIL_PASSWORD=$(pass Email/ece458a3)
npm run serve
