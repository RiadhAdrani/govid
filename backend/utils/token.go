package utils

func CreateTokenKey(id string, subject string) string {
	return id + "-" + subject
}
