package schema

// ! camelCase json fields !
type Subscription struct {
	SubscriberId int  `json:"subscriberId" gorm:"not null"`
	Subscriber   User `json:"subscriber" gorm:"foreignKey:SubscriberId"`
	SubscribedId int  `json:"subscribedId" gorm:"not null"`
	Subscribed   User `json:"subscribed" gorm:"foreignKey:SubscribedId"`

	// gorm overrides
	Base
}
