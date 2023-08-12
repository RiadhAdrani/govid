package schema

// ! camelCase json fields !
type Video struct {
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description" gorm:"not null"`
	Public      bool   `json:"privacy" gorm:"not null"`
	OwnerId     int    `json:"ownerId" gorm:"not null"`
	Owner       User   `json:"owner" gorm:"foreignKey:OwnerId"`
	Tags        string `json:"tags"`
	Filename    string `json:"filename" gorm:"not null"`

	LikesCount    int `json:"likesCount" gorm:"-"`
	DisLikesCount int `json:"dislikesCount" gorm:"-"`

	IsLiked    bool `json:"isLiked" gorm:"-"`
	IsDisLiked bool `json:"isDisliked" gorm:"-"`

	// gorm overrides
	Base
}
