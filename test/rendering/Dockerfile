# The Linux environment of the rendering job on GitHub CI (ubuntu-latest, x64).
# Run the tests in it with `npm run test-rendering-docker`.
FROM ubuntu:24.04

ARG NODE_MAJOR=24
ENV DEBIAN_FRONTEND=noninteractive

# Fonts and the libraries Puppeteer's Chrome needs.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates curl unzip xz-utils \
    fonts-liberation fonts-dejavu-core fonts-noto-core fonts-noto-color-emoji \
    libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libcairo2 libcups2t64 \
    libdrm2 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnss3 libpango-1.0-0 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxkbcommon0 libxrandr2 \
    libxshmfence1 libxss1 \
  && rm -rf /var/lib/apt/lists/*

RUN base=https://nodejs.org/dist/latest-v${NODE_MAJOR}.x \
  && file=$(curl -fsSL $base/SHASUMS256.txt | grep -o 'node-v[0-9.]*-linux-x64\.tar\.xz') \
  && curl -fsSL $base/$file | tar -xJ -C /usr/local --strip-components=1

WORKDIR /repo
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
