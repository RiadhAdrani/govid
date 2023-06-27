package controller

import (
	"backend/config"
	"backend/schema"
	"backend/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func GetAllUsers(c *gin.Context) {
	users := []schema.User{}

	config.DB.Find(&users)

	c.JSON(200, &users)
}

func UpdateUser(c *gin.Context) {
	var user schema.User

	// TODO: add body validation

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
func CreateUser(c *gin.Context) {
	var body schema.User

	// TODO: add body validation

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

	user := schema.User{
		Email:     body.Email,
		Password:  string(hash),
		FirstName: body.FirstName,
		LastName:  body.LastName,
	}

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
		"sub": user.Id,
		"exp": time.Now().Add(time.Hour * 24 * 7),
	})

	tokenString, tokenErr := token.SignedString([]byte(config.SECRET_JWT))

	if tokenErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create token",
		})

		return
	}

	config.CacheDB.Set(c, utils.CreateTokenKey(user.Id, config.AUTH_SUBJECT), tokenString, time.Duration(time.Hour*24*7))

	savedToken := config.CacheDB.Get(c, utils.CreateTokenKey(user.Id, config.AUTH_SUBJECT)).Val()

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", savedToken, 3600*24*7, "", "", false, true)
	c.JSON(http.StatusOK, gin.H{"token": savedToken})
}

func GetUser(c *gin.Context) {
	user, _ := c.Get("user")

	c.JSON(http.StatusOK, gin.H{"user": user})
}
