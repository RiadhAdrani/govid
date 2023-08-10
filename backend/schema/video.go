package schema

import (
	"time"

	"gorm.io/gorm"
)

// ! camelCase json fields !
type Video struct {
	Id          int    `json:"id" gorm:"primaryKey"`
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description" gorm:"not null"`
	Public      bool   `json:"privacy" gorm:"not null"`
	OwnerId     int    `json:"ownerId" gorm:"not null"`
	Owner       User   `json:"owner" gorm:"foreignKey:OwnerId"`
	Tags        string `json:"tags"`
	Filename    string `json:"filename" gorm:"not null"`

	// gorm overrides
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}
