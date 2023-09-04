package schema

type Playlist struct {
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description" gorm:"not null"`
	Public      bool   `json:"isPublic" gorm:"default:true"`
	OwnerId     int    `json:"ownerId" gorm:"not null"`
	Owner       User   `json:"owner" gorm:"foreignKey:OwnerId"`

	Base
}

type PlaylistVideo struct {
	VideoId int   `json:"videoId" gorm:"not null"`
	Video   Video `json:"video" gorm:"foreignKey:VideoId"`

	PlaylistId int   `json:"playlistId" gorm:"not null"`
	Playlist   Video `json:"playlist" gorm:"foreignKey:PlaylistId"`

	Base
}
