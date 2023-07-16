package utils

import (
	"reflect"
	"regexp"
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
