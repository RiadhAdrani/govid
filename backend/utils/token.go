package utils

import "strconv"

func CreateTokenKey(id int, subject string) string {
	return strconv.Itoa(id) + "-" + subject
}
