package schema

type User struct {
	FirstName string `json:"firstName" gorm:"not null"`
	LastName  string `json:"lastName" gorm:"not null"`
	Email     string `json:"email" gorm:"not null,unique"`
	Password  string `json:"-" gorm:"not null"`

	SubCount   int64 `json:"subCount" gorm:"-"`
	Subscribed bool  `json:"subscribed" gorm:"-"`

	// gorm overrides
	Base
}
