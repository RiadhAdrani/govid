package main

import "github.com/gin-gonic/gin"

func main() {
	server := gin.Default()
	server.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Yes",
		})
	})
	server.Run() // listen and serve on 0.0.0.0:8080
}