FROM node:16

# Instalar dependencias necesarias y actualizar libvips
RUN apt-get update && \
    apt-get install -y libvips-dev wget && \
    wget -qO- https://github.com/libvips/libvips/releases/download/v8.11.3/vips-8.11.3.tar.gz | tar xz && \
    cd vips-8.11.3 && \
    ./configure && \
    make && \
    make install

# Creates app directory
WORKDIR /code

# Install dependencies
COPY package.json /code
RUN npm install

# Bundles app source
COPY . /code

# Expose port 3000
EXPOSE 3000

# Starts server
CMD ["npm", "run", "dev"]
