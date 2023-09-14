package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func PlaylistRoutes(router *gin.Engine) {
	router.POST("/playlists", middleware.RequireAuth, controller.CreatePlaylist)

	router.GET("/playlists/users/me", middleware.RequireAuth, controller.GetMyPlaylists)
	router.GET("/playlists/users/:id", controller.GetPlaylists)

	router.GET("/playlists/:id", controller.GetPlaylist)

	router.GET("/playlists/videos/:id", middleware.RequireAuth, controller.GetAddPlaylistOptions)

	router.DELETE("/playlists/:id", middleware.RequireAuth, controller.DeletePlaylist)
	router.PUT("/playlists/:id", middleware.RequireAuth, controller.UpdatePlaylist)

	router.POST("/playlists/:id/videos/:video", middleware.RequireAuth, controller.AddPlaylistVideo)
	router.DELETE("/playlists/:id/videos/:video", middleware.RequireAuth, controller.DeletePlaylistVideo)
}
