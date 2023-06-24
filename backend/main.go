package main

import "github.com/gin-gonic/gin"

func main() {
	server := gin.Default()

	// ping
	server.GET("/ping", func(context *gin.Context) {
		context.JSON(200, gin.H{
			"message": "Yes",
		})
	})

	// users
	server.GET("/users", func(context *gin.Context) {
		context.JSON(200, gin.H{
			"user": gin.H{
				"hello":"world",
				"age":3,
			},
		})
	})
	server.Run() // listen and serve on 0.0.0.0:8080
}