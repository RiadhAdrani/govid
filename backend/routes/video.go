package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func VideoRoutes(router *gin.Engine) {
	router.POST("/videos", middleware.RequireAuth, controller.CreateVideo)

	router.GET("/videos/watch/:id", controller.WatchVideo)
	router.GET("/videos/:id", controller.GetVideo)

	router.POST("/videos/:id/like", middleware.RequireAuth, controller.LikeVideo)
	router.DELETE("/videos/:id/like", middleware.RequireAuth, controller.UnLikeVideo)

	router.POST("/videos/:id/dislike", middleware.RequireAuth, controller.DisLikeVideo)
	router.DELETE("/videos/:id/dislike", middleware.RequireAuth, controller.UnDisLikeVideo)
}
