package schema

import (
	"time"

	"gorm.io/gorm"
)

type Base struct {
	Id int `json:"id" gorm:"primaryKey"`

	// gorm overrides
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

type Action struct {
	Base

	UserId int  `json:"userId" gorm:"not null"`
	User   User `json:"user" gorm:"foreignKey:UserId"`
}
