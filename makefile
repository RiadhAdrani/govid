BACKEND_IMG = youtube-clone-backend-go
FRONTEND_IMG = youtube-clone-frontend-ruvy

prepare-dev:
	cd ./backend && docker build -t ${BACKEND_IMG} .
	cd ./frontend && docker build -t ${FRONTEND_IMG} .

install-deps:
	cd ./backend && go get
	cd ./frontend && yarn

start-front:
	cd ./frontend && docker run -it -p 3000:3000 -v ./:/app/ ${FRONTEND_IMG}

start-back:
	cd ./backend && docker run -it -p 8080:8080 -v ./:/app/ ${BACKEND_IMG}