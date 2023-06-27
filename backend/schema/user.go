package schema

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Id        int    `json:"id" gorm:"primary_key"`
	FirstName string `json:"first_name" gorm:"not null"`
	LastName  string `json:"last_name" gorm:"not null"`
	Email     string `json:"email" gorm:"not null,unique"`
	Password  string `json:"password" gorm:"not null"`
}
