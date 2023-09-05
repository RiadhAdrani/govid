package controller

import (
	"backend/config"
	"backend/middleware"
	"backend/schema"
	"backend/utils"
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreatePlaylistBody struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

func beforePlaylistAction(c *gin.Context) (schema.User, schema.Playlist, int, error) {
	user := schema.User{}
	playlist := schema.Playlist{}

	user = middleware.GetUserFromContext(c)

	if user.Id == 0 {
		return user, playlist, http.StatusForbidden, errors.New("user not found")
	}

	id, err := utils.GetIdParamFromContext("id", c)

	if err != nil {
		return user, playlist, http.StatusUnprocessableEntity, errors.New("invalid playlsit id")
	}

	err = config.DB.Preload("Owner").First(&playlist, id).Error

	if err != nil {
		return user, playlist, http.StatusNotFound, errors.New("playlist not found")
	}

	return user, playlist, http.StatusOK, nil
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

type UpdatePlaylistBody struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func UpdatePlaylist(c *gin.Context) {
	user, playlist, status, err := beforePlaylistAction(c)

	if err != nil {
		c.JSON(status, gin.H{
			"err": err.Error(),
			"msg": "something went wrong",
		})
		return
	}

	// check user
	if user.Id != playlist.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{
			"err": err.Error(),
			"msg": "forbidden action",
		})
		return
	}

	body := UpdatePlaylistBody{}

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "bad request body",
		})
		return
	}

	// title
	if body.Title != "" {
		playlist.Title = body.Title
	}

	if body.Description != "" {
		playlist.Description = body.Description
	}

	err = config.DB.Save(&playlist).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "unable to update playlist",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": playlist,
		"msg":  "playlist updated successfully",
	})
}

func getPlaylists(userId int, from int, count int) ([]schema.Playlist, error) {
	playlists := []schema.Playlist{}

	err := config.DB.Offset(from).Limit(count).Preload("Owner").Where("playlists.owner_id = ?", userId).Find(&playlists).Error

	return playlists, err
}

func GetMyPlaylists(c *gin.Context) {
	user := middleware.GetUserFromContext(c)

	from, count, err := utils.GetPaginationDataFromContext(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "bad pagination",
		})
		return
	}

	playlists, err := getPlaylists(user.Id, from, count)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "unable to retrieve playlists",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": playlists,
	})
}

func GetPlaylists(c *gin.Context) {
	user := schema.User{}

	// find user
	userId, err := utils.GetIdParamFromContext("id", c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "invalid user id",
		})
		return
	}

	err = config.DB.First(&user, userId).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "unable to get user",
		})
		return
	}

	from, count, err := utils.GetPaginationDataFromContext(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"err": err.Error(),
			"msg": "bad pagination",
		})
		return
	}

	log.Printf("user id = %d", user.Id)

	playlists, err := getPlaylists(userId, from, count)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"err": err.Error(),
			"msg": "unable to retrieve playlists",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": playlists,
		"user": user,
	})
}
