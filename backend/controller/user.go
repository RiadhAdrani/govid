package controller

import (
	"backend/config"
	"backend/schema"

	"github.com/gin-gonic/gin"
)

func GetUsers(c *gin.Context) {
	users := []schema.User{}

	config.DB.Find(&users)

	c.JSON(200, &users)
}

func CreateUser(c *gin.Context) {
	var user schema.User

	c.BindJSON(&user)

	config.DB.Create(&user)

	c.JSON(200, &user)
}

func UpdateUser(c *gin.Context) {
	var user schema.User

	config.DB.Where("id = ?", c.Param("id")).First(&user)
	c.BindJSON(&user)

	config.DB.Save(&user)

	c.JSON(200, &user)
}

func DeleteUser(c *gin.Context) {
	var user schema.User

	config.DB.Where("id = ?", c.Param("id")).Delete(&user)

	c.JSON(200, &user)
}
