package routes

import (
	"backend/controller"
	"log"

	"github.com/gin-gonic/gin"
)

func UserRoutes(router *gin.Engine) {
	router.GET("/users", func(ctx *gin.Context) {
		controller.GetUsers(ctx)
	})

	router.POST("/users", func(ctx *gin.Context) {
		log.Printf("yeet")

		controller.CreateUser(ctx)
	})

	router.DELETE("/users/:id", func(ctx *gin.Context) {
		controller.DeleteUser(ctx)
	})

	router.PUT("/users/:id", func(ctx *gin.Context) {
		controller.UpdateUser(ctx)
	})

	router.POST("/signup", func(ctx *gin.Context) {
		controller.SignUpUser(ctx)
	})

	router.POST("/signin", func(ctx *gin.Context) {
		controller.SignInUser(ctx)
	})

}
