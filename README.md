# GoVid

A youtube clone made with `Gin` (Golang) and `Ruvy` (TypeScript).

## Run it locally

Assuming you have `Docker` in your machine, clone this project, `cd` into the clone directory and run:

```bash
make prepare-dev
```

Install dependencies using:

```bash
make install-deps
```

which will build the docker images. Then we need two terminals to run the `backend` and `frontend` containers:

```bash
# terminal 1
make start-front

# terminal 2
make start-back
```

## Hot reloading

Hot reloading is enabled for `backend` using `air` and `frontend` using `vite`.

## Note

_If you are wondering why I didn't use `docker-compose` to run both containers, it is because this is a learning project to solidify what I learned about docker and it makes things more clear and abstract when I start from the method with more configurations._
