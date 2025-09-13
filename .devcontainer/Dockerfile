# Lightweight base with common build tools
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Create the non-root user 'vscode' (devcontainers expects it)
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000

# Install OS packages: git already added by feature, but we add DB/geo/redis tools
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates curl jq unzip \
    build-essential pkg-config \
    postgresql-client libpq-dev \
    redis-tools \
    gdal-bin libgdal-dev \
    # useful CLI tools
    bash-completion less nano iputils-ping net-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# pnpm & yarn (global), uv for Python speed
RUN corepack enable && corepack prepare pnpm@latest --activate && npm i -g yarn@latest && \
    curl -LsSf https://astral.sh/uv/install.sh | sh

# Make sure the 'vscode' user owns the home dir
RUN if ! id -u ${USERNAME} >/dev/null 2>&1; then \
      groupadd --gid ${USER_GID} ${USERNAME} && \
      useradd -s /bin/bash --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME}; \
    fi

USER ${USERNAME}
WORKDIR /workspaces/eagleguide