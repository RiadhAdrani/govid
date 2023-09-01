package routes

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func VideoRoutes(router *gin.Engine) {
	router.POST("/videos", middleware.RequireAuth, controller.StartVideoUpload)
	router.POST("/videos/:id/upload", middleware.RequireAuth, controller.UploadVideoChunk)
	router.GET("/videos/:id/upload/progress", middleware.RequireAuth, controller.GetVideoUploadProgress)

	router.GET("/videos/:id/watch", controller.WatchVideo)
	router.GET("/videos/:id", controller.GetVideo)

	router.POST("/videos/:id/like", middleware.RequireAuth, controller.LikeVideo)
	router.DELETE("/videos/:id/like", middleware.RequireAuth, controller.UnLikeVideo)

	router.POST("/videos/:id/dislike", middleware.RequireAuth, controller.DisLikeVideo)
	router.DELETE("/videos/:id/dislike", middleware.RequireAuth, controller.UnDisLikeVideo)

	router.POST("/videos/:id/watch", controller.AddWatchTime)
	router.POST("/videos/:id/view", controller.AddView)

	router.GET("/videos/:id/comments", controller.GetComments)
	router.POST("/videos/:id/comments", middleware.RequireAuth, controller.CreateComment)
	router.DELETE("/videos/:id/comments/:comment", middleware.RequireAuth, controller.DeleteComment)
	router.PUT("/videos/:id/comments/:comment", middleware.RequireAuth, controller.UpdateComment)

	router.POST("/videos/:id/comments/:comment/pin", middleware.RequireAuth, controller.PinComment)
	router.DELETE("/videos/:id/comments/:comment/pin", middleware.RequireAuth, controller.UnpinComment)

	router.POST("/videos/:id/comments/:comment/like", middleware.RequireAuth, controller.LikeComment)
	router.DELETE("/videos/:id/comments/:comment/like", middleware.RequireAuth, controller.UnLikeComment)

	router.POST("/videos/:id/comments/:comment/dislike", middleware.RequireAuth, controller.DislikeComment)
	router.DELETE("/videos/:id/comments/:comment/dislike", middleware.RequireAuth, controller.UnDislikeComment)

	router.POST("/videos/:id/comments/:comment/heart", middleware.RequireAuth, func(c *gin.Context) { controller.ToggleHeartComment(c, true) })
	router.DELETE("/videos/:id/comments/:comment/heart", middleware.RequireAuth, func(c *gin.Context) { controller.ToggleHeartComment(c, false) })

	router.GET("/videos/:id/comments/:comment/replies", controller.GetReplies)
	router.POST("/videos/:id/comments/:comment/replies", middleware.RequireAuth, controller.CreateReply)
	router.PUT("/videos/:id/comments/:comment/replies/:reply", middleware.RequireAuth, controller.UpdateReply)
	router.DELETE("/videos/:id/comments/:comment/replies/:reply", middleware.RequireAuth, controller.DeleteReply)
}
