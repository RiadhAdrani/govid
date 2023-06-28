package controller

import (
	"backend/config"
	"backend/schema"
	"backend/utils"
	"backend/validators"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
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
	var body validators.UserCreation

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	v := validator.New()
	err := v.Struct(body)

	if err != nil {

		errors := []string{}

		for _, e := range err.(validator.ValidationErrors) {
			msg := strings.SplitAfterN(e.Error(), "Error:", 2)[1]
			errors = append(errors, msg)
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error":  err.(validator.ValidationErrors).Error(),
			"errors": errors,
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

	user.Password = ""

	c.JSON(http.StatusOK, gin.H{"message": "user created successfully", "user": user})
}

func SignInUser(c *gin.Context) {
	var body validators.UserSignin

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	v := validator.New()
	vErr := v.Struct(body)

	if vErr != nil {

		errors := []string{}

		for _, e := range vErr.(validator.ValidationErrors) {
			msg := strings.SplitAfterN(e.Error(), "Error:", 2)[1]
			errors = append(errors, msg)
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error":  vErr.(validator.ValidationErrors).Error(),
			"errors": errors,
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

	c.JSON(http.StatusOK, gin.H{"token": savedToken})
}

func GetUser(c *gin.Context) {
	user, _ := c.Get("user")

	c.JSON(http.StatusOK, gin.H{"user": user})
}
