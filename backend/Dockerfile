FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY ./requirements.dev.txt /tmp/requirements.dev.txt
COPY ./src /backend/src

WORKDIR /backend/src
EXPOSE 8000

ARG DEV=true

RUN python -m venv /py && \
    /py/bin/pip install --upgrade pip && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev && \
    /py/bin/pip install -r /tmp/requirements.txt && \
    if [ "$DEV" = "true" ]; then /py/bin/pip install -r /tmp/requirements.dev.txt; fi && \
    apt-get purge -y --auto-remove build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/* /tmp && \
    useradd --no-create-home --shell /bin/bash django-user

ENV PATH="/py/bin:$PATH"

USER django-user