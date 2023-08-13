FROM golang:1.20-alpine

WORKDIR /app

RUN go install github.com/cosmtrek/air@latest

EXPOSE 8080

COPY go.mod go.sum ./
RUN go mod download

RUN apk update && apk upgrade && apk add ffmpeg

CMD ["air"]