package config

import (
	"log"

	"github.com/redis/go-redis/v9"
)

var CacheDB *redis.Client

func ConnectCache() {
	db := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	log.Printf("Connected to Redis DB")

	CacheDB = db
}
