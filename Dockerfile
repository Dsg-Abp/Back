# Use uma imagem Node.js como base
FROM node:16

# Crie o diretório de trabalho
WORKDIR /app

# Copie o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código
COPY . .

# Construa a aplicação
RUN npm run build

# Exponha a porta na qual sua aplicação vai rodar
EXPOSE 3202

# Comando para iniciar a aplicação
CMD ["npm", "start"]
