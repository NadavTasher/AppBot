FROM node:buster-slim
# Change working directory
WORKDIR /usr/src/app
# Copy application files
COPY app .
# Install dependencies
RUN npm install
# Expose ports
EXPOSE 3000
# Run application
CMD ["node", "app.js"]