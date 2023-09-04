package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func PlaylistRoutes(router *gin.Engine) {
	router.POST("/playlists", middleware.RequireAuth, controller.CreatePlaylist)

	router.DELETE("/playlists/:id", middleware.RequireAuth, controller.DeletePlaylist)
}
