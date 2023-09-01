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

type Rateable struct {
	LikeCount    int64 `json:"likeCount"  gorm:"default:0"`
	DislikeCount int64 `json:"dislikeCount" gorm:"default:0"`
	IsLiked      bool  `json:"isLiked" gorm:"default:null"`
	IsDisliked   bool  `json:"isDisliked" gorm:"default:null"`
	IsHearted    bool  `json:"isHearted" gorm:"default:null"`
}
