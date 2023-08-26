package utils

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"

	"github.com/gin-gonic/gin"
)

const EmailRegEx = `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`

func HasKey(o Map, key string) bool {
	_, ok := o[key]

	return ok
}

func OfType(o interface{}, t reflect.Type) bool {
	return reflect.TypeOf(o) == t
}

func StringOfLength(str string, min int, max int) bool {
	return len(str) >= min && len(str) <= max
}

func IsValidEmail(str string) bool {
	return regexp.MustCompile(EmailRegEx).MatchString(str)
}

func GetIdParamFromContext(idName string, c *gin.Context) (int, error) {
	id := 0

	// convert videoId to int
	id, err := strconv.Atoi(c.Param(idName))

	if err != nil {
		return id, fmt.Errorf("unable to parse id %s", idName)
	}

	return id, nil
}
