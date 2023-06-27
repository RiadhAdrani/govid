package middleware

import (
	"backend/config"
	"backend/schema"
	"backend/utils"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(c *gin.Context) {
	// Get the token off request
	tokenString, err := c.Cookie("token")

	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
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

	if ok {
		// check the exp
		parsedTime, err := time.Parse(time.RFC3339Nano, claims["exp"].(string))
		if err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		if float64(time.Now().Unix()) > float64(parsedTime.Unix()) {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		key := utils.CreateTokenKey(int(claims["sub"].(float64)), config.AUTH_SUBJECT)

		// we also need to check redis if the token exists or not
		exists, err := config.CacheDB.Exists(c, key).Result()

		if err != nil || exists != 1 {
			fmt.Println("invalid")
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// find the user with token
		var user schema.User
		config.DB.First(&user, claims["sub"])

		if user.Id == 0 {
			c.AbortWithStatus(http.StatusNotFound)
		}

		// attach to the request
		c.Set("user", user)

		// continue
		c.Next()

	} else {
		c.AbortWithStatus(http.StatusUnauthorized)
	}

}
