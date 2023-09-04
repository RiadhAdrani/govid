package controller

import (
	"backend/config"
	"backend/middleware"
	"backend/schema"
	"backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreatePlaylistBody struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

func CreatePlaylist(c *gin.Context) {
	user := middleware.GetUserFromContext(c)

	// get body
	body := CreatePlaylistBody{}

	err := c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "invalid body",
		})

		return
	}

	playlist := schema.Playlist{}

	playlist.Owner = user
	playlist.OwnerId = user.Id
	playlist.Title = body.Title
	playlist.Description = body.Description

	err = config.DB.Save(&playlist).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "invalid body",
		})

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": playlist,
	})
}

func DeletePlaylist(c *gin.Context) {
	user := middleware.GetUserFromContext(c)

	id, err := utils.GetIdParamFromContext("id", c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "invalid playlist id",
		})

		return
	}

	playlist := schema.Playlist{}

	// find playlist
	err = config.DB.First(&playlist, id).Error

	if err != nil || playlist.Id == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"err": err.Error(),
			"msg": "playlist not found",
		})

		return
	}

	// check user
	if user.Id != playlist.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{
			"msg": "forbidden action",
		})

		return
	}

	// delete playlist
	err = config.DB.Delete(&playlist).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "unable to delete playlist",
		})

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"msg": "deleted playlist successfully",
	})
}
