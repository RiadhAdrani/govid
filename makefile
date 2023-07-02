install:
	cd ./backend && go get
	cd ./frontend && yarn

start:
	docker compose up

build:
	docker compose up --build
