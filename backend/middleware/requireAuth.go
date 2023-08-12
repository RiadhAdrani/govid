package middleware

import (
	"backend/config"
	"backend/schema"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func GetUserFromContext(c *gin.Context) schema.User {
	user := schema.User{}

	// Get the token off request
	tokenString, err := c.Cookie("token")

	if err != nil {
		return user
	}

	// decode and validate
	token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(config.SECRET_JWT), nil
	})

	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok {
		return user
	}

	// check the exp
	parsedTime, err := time.Parse(time.RFC3339Nano, claims["exp"].(string))
	if err != nil {
		return user
	}

	if float64(time.Now().Unix()) > float64(parsedTime.Unix()) {
		return user
	}

	config.DB.First(&user, claims["sub"])

	if user.Id == 0 {
		return user
	}

	return user

}

func RequireAuth(c *gin.Context) {
	user := GetUserFromContext(c)

	if user.Id == 0 {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// attach to the request
	c.Set("user", user)

	// continue
	c.Next()

}
