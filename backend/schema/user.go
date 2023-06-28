package schema

import (
	"time"

	"gorm.io/gorm"
)

// ! camelCase json fields !
type User struct {
	Id        int    `json:"id" gorm:"primary_key"`
	FirstName string `json:"firstName" gorm:"not null"`
	LastName  string `json:"lastName" gorm:"not null"`
	Email     string `json:"email" gorm:"not null,unique"`
	Password  string `json:"password" gorm:"not null"`

	// gorm overrides
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}
