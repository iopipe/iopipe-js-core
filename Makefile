SHELL=/bin/bash

DOCKER_COMPOSE_YML?=docker-compose.yml

test:
	docker-compose -f ${DOCKER_COMPOSE_YML} build node
