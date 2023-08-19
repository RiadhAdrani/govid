package schema

// ! camelCase json fields !
type Video struct {
	Title           string  `json:"title" gorm:"not null"`
	Description     string  `json:"description" gorm:"not null"`
	Public          bool    `json:"isPublic" gorm:"default:false"`
	OwnerId         int     `json:"ownerId" gorm:"not null"`
	Owner           User    `json:"owner" gorm:"foreignKey:OwnerId"`
	Tags            string  `json:"tags"`
	Filename        string  `json:"filename"`
	Duration        float64 `json:"duration" gorm:"default:0"`
	MinViewDuration float64 `json:"minViewDuration" gorm:"default:30"`
	LikesCount      int     `json:"likesCount" gorm:"-"`
	DisLikesCount   int     `json:"dislikesCount" gorm:"-"`
	IsLiked         bool    `json:"isLiked" gorm:"-"`
	IsDisLiked      bool    `json:"isDisliked" gorm:"-"`
	Views           int64   `json:"views" gorm:"-"`

	// gorm overrides
	Base
}

type VideoAction struct {
	VideoId int   `json:"videoId" gorm:"not null"`
	Video   Video `json:"video" gorm:"foreignKey:VideoId"`

	Action
}

type AnonymousVideoAction struct {
	Base

	UserId  int   `json:"userId"`
	VideoId int   `json:"videoId" gorm:"not null"`
	Video   Video `json:"video" gorm:"foreignKey:VideoId"`
}

type VideoUploadTask struct {
	Status   string `json:"status" gorm:"not null"`
	Uploaded int64  `json:"uploaded" gorm:"default:0"`
	Size     int64  `json:"size" gorm:"not null"`
	Filename string `json:"filename" form:"not null"`

	VideoAction
}

type VideoUploadChunk struct {
	From     int64  `json:"-" gorm:"not null"`
	To       int64  `json:"-" gorm:"not null"`
	Filename string `json:"-" gorm:"no null"`

	VideoAction
}

type VideoWatchTime struct {
	Time float64 `json:"time" gorm:"not null"`
	From float64 `json:"from" gorm:"not null"`
	To   float64 `json:"to" gorm:"not null"`

	AnonymousVideoAction
}

type VideoView struct {
	AnonymousVideoAction
}

type VideoLike struct {
	VideoAction
}

type VideoDisLike struct {
	VideoAction
}

type VideoComment struct {
	Text string `json:"text" gorm:"not null"`

	VideoAction
}

type VideoCommentAction struct {
	Comment   VideoComment `json:"comment" gorm:"foreignKey:CommentId"`
	CommentId string       `json:"commentId" gorm:"not null"`

	Action
}

type VideoCommentLike struct {
	VideoCommentAction
}

type VideoCommentDisLike struct {
	VideoCommentAction
}

type VideoReply struct {
	Text string `json:"text" gorm:"not null"`

	VideoCommentAction
}

type VideoReplyLike struct {
	VideoCommentAction
}

type VideoReplyDisLike struct {
	VideoCommentAction
}
