package schema

// ! camelCase json fields !
type User struct {
	FirstName string `json:"firstName" gorm:"not null"`
	LastName  string `json:"lastName" gorm:"not null"`
	Email     string `json:"email" gorm:"not null,unique"`
	Password  string `json:"-" gorm:"not null"`

	SubCount int `json:"subCount" gorm:"-"`

	// gorm overrides
	Base
}
