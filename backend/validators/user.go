package validators

type UserCreation struct {
	FirstName string `json:"firstName" validate:"required,min=2,max=100"`
	LastName  string `json:"lastName" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6,max=40"`
}

type UserSignin struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
