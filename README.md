# GoVid

A youtube clone made with `Gin` (Golang) and `Ruvy` (TypeScript).

## Get started

Assuming you have `Docker` in your machine, clone this project, `cd` into the clone directory and run:

```bash
make prepare-dev
```

which will build the docker images. Then we need two terminals to run the `backend` and `frontend` containers:

```bash
# terminal 1
make start-front

# terminal 2
make start-back
```

Hot reloading is enabled for `backend` using `air` and `frontend` using `vite`.
