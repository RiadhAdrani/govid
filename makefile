install:
	cd ./backend && go get
	cd ./frontend && yarn

start:
	docker compose up

restart:
	docker compose up --build
