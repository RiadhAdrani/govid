package main

import (
	"backend/config"
	user "backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID   int64  `bun:"id,pk,autoincrement"`
	Name string `bun:"name,notnull"`
}

func main() {
	router := gin.New()
	router.Use(cors.Default())

	config.ConntectDB()
	config.ConnectCache()

	// ping
	router.GET("/ping", func(context *gin.Context) {
		context.JSON(200, gin.H{
			"message": "ping successful",
		})
	})

	// users
	user.UserRoutes(router)

	router.Run() // listen and serve on 0.0.0.0:8080
}
