FROM node:24-alpine

#Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock
COPY package*.json ./

# Install depencies
RUN npm install

# copy the rest of your files
COPY . .

# Expose the default React port 3000
EXPOSE 3000

CMD ["npm", "start"]

