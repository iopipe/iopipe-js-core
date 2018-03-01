SHELL=/bin/bash

DOCKER_COMPOSE_YML?=docker-compose.yml

test: clean
	docker-compose -f ${DOCKER_COMPOSE_YML} build node
