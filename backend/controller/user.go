package controller

import (
	"backend/config"
	"backend/schema"
	"backend/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
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

// perform sign up and send a token
func SignUpUser(c *gin.Context) {
	// TODO: add other necessary fields
	var body struct {
		Email    string
		Password string
	}

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to hash password",
		})

		return
	}

	user := schema.User{Email: body.Email, Password: string(hash)}

	result := config.DB.Create(&user)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create user",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user created successfully"})
}

func SignInUser(c *gin.Context) {
	// TODO: add other necessary fields
	var body struct {
		Email    string
		Password string
	}

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	var user schema.User

	config.DB.First(&user, "email = ?", body.Email)

	if user.Id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email or password",
		})

		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email or password",
		})

		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.Id,
		"date": time.Now(),
	})

	tokenString, tokenErr := token.SignedString([]byte(config.SECRET_JWT))

	if tokenErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create token",
			"msg":   tokenErr.Error(),
		})

		return
	}

	config.CacheDB.Set(c, utils.CreateTokenKey(strconv.Itoa(user.Id), config.AUTH_SUBJECT), tokenString, time.Duration(time.Hour*24*7))

	savedToken := config.CacheDB.Get(c, utils.CreateTokenKey(strconv.Itoa(user.Id), config.AUTH_SUBJECT)).Val()

	c.JSON(http.StatusOK, gin.H{"token": savedToken})
}
