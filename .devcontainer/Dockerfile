# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates curl jq unzip \
    build-essential pkg-config \
    postgresql-client libpq-dev \
    redis-tools \
    gdal-bin libgdal-dev \
    bash-completion less nano iputils-ping net-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create vscode user if not present 
RUN if ! id -u ${USERNAME} >/dev/null 2>&1; then \
    groupadd --gid ${USER_GID} ${USERNAME} && \
    useradd -s /bin/bash --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME}; \
    fi

USER ${USERNAME}
WORKDIR /workspaces/eagleguide
