package schema

type VideoAction struct {
	VideoId int   `json:"videoId" gorm:"not null"`
	Video   Video `json:"video" gorm:"foreignKey:VideoId"`

	Action
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
