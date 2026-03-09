FROM node:22.15.0-alpine
RUN apk update && apk upgrade && apk --no-cache add \
    python3 \
    py3-pip \
    && python3 -m venv /opt/venv \
    && source /opt/venv/bin/activate \
    && pip install --upgrade pip \
    && pip install awscli \
    && apk del py3-pip

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

ARG NPMRC
RUN echo -e $NPMRC > .npmrc && \
    cat .npmrc

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

WORKDIR /app/dist
ARG AWS_REGION
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_SESSION_TOKEN
ARG S3_BUCKET_KEY

ENV AWS_REGION=$AWS_REGION
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
ENV S3_BUCKET_KEY=$S3_BUCKET_KEY

RUN AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY AWS_REGION=$AWS_REGION aws s3 cp  --recursive ./ $S3_BUCKET_KEY