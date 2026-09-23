FROM nginx:alpine

# Build arguments
ARG APP_ENV=BLUE
ARG APP_VERSION=v1.0.0

# Copy website
COPY app/ /usr/share/nginx/html/

# Generate runtime config consumed by app.js
RUN echo "{\"environment\":\"${APP_ENV}\",\"version\":\"${APP_VERSION}\"}" \
    > /usr/share/nginx/html/config.json

EXPOSE 80