package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func PlaylistRoutes(router *gin.Engine) {
	router.POST("/playlists", middleware.RequireAuth, controller.CreatePlaylist)

	router.GET("/playlists/user/:id", controller.GetPlaylists)
	router.GET("/playlists/me", middleware.RequireAuth, controller.GetMyPlaylists)

	router.DELETE("/playlists/:id", middleware.RequireAuth, controller.DeletePlaylist)
	router.PUT("/playlists/:id", middleware.RequireAuth, controller.UpdatePlaylist)
}
