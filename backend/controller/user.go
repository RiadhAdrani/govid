package controller

import (
	"backend/config"
	"backend/schema"
	"backend/validators"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func GetAllUsers(c *gin.Context) {
	// users := []schema.User{}

	// config.DB.Find(&users)

	// c.JSON(200, &users)

	c.JSON(404, gin.H{"error": "Not implemented yet"})
}

func UpdateUser(c *gin.Context) {
	// var user schema.User

	// // TODO: add body validation

	// config.DB.Where("id = ?", c.Param("id")).First(&user)
	// c.BindJSON(&user)

	// config.DB.Save(&user)

	// c.JSON(200, &user)

	c.JSON(404, gin.H{"error": "Not implemented yet"})
}

func DeleteUser(c *gin.Context) {
	// var user schema.User

	// config.DB.Where("id = ?", c.Param("id")).Delete(&user)

	// c.JSON(200, &user)

	c.JSON(404, gin.H{"error": "Not implemented yet"})
}

// perform sign up and send a token
func CreateUser(c *gin.Context) {
	var body validators.CreateUserBody

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	validated, err := validators.CreateUser(body)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(validated.Password), 10)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to hash password",
		})

		return
	}

	user := schema.User{
		Email:     validated.Email,
		Password:  string(hash),
		FirstName: validated.FirstName,
		LastName:  validated.LastName,
	}

	result := config.DB.Create(&user)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": result.Error.Error(),
		})

		return
	}

	user.Password = ""

	c.JSON(http.StatusOK, gin.H{"message": "user created successfully", "user": user})
}

func SignInUser(c *gin.Context) {
	var body validators.UserSigninBody

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	validated, err := validators.UserSignIn(body)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
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

	pwdErr := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(validated.Password))

	if pwdErr != nil {
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

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

func GetUser(c *gin.Context) {
	user, exists := c.Get("user")

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User not found",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
