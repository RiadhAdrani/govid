package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func UserRoutes(router *gin.Engine) {
	router.DELETE("/users/:id", middleware.RequireAuth, controller.DeleteUser)
	router.PUT("/users/:id", middleware.RequireAuth, controller.UpdateUser)

	router.GET("/users/me", middleware.RequireAuth, controller.GetCurrentUser)
	router.GET("/users/:id", controller.GetUser)

	// auth
	router.POST("/signup", controller.CreateUser)
	router.POST("/signin", controller.SignInUser)

	// subscription
	router.POST("/users/:id/subscribe", middleware.RequireAuth, controller.Subscribe)
	router.DELETE("/users/:id/subscribe", middleware.RequireAuth, controller.Unsubscribe)
}
