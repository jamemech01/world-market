FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx tsc -p tsconfig.build.json --incremental false

EXPOSE 3000

CMD ["node", "dist/main"]