package schema

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Id       int    `json:"id" gorm:"primary_key"`
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"not null,unique"`
	Password string `json:"password" gorm:"not null"`
}
