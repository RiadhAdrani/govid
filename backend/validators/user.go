package validators

import (
	"backend/utils"
	"errors"
)

type UserSigninBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateUserBody struct {
	UserSigninBody

	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

func CreateUser(body CreateUserBody) (*CreateUserBody, error) {

	var validFirstName bool = utils.StringOfLength(body.FirstName, 3, 128)

	// check if first name is valid
	if !validFirstName {
		return nil, errors.New("required field (first name) should be a string of 3 to 128 characters in length")
	}

	var validLastName bool = utils.StringOfLength(body.LastName, 3, 128)

	// check if last name is valid
	if !validLastName {
		return nil, errors.New("required field (last name) should be a string of 3 to 128 characters in length")
	}

	var validEmail bool = utils.IsValidEmail(body.Email)

	// check if email is valid
	if !validEmail {
		return nil, errors.New("required field (email) should be a valid email string")
	}

	var validPassword bool = utils.StringOfLength(body.Password, 6, 128)

	// check if password is valid
	if !validPassword {
		return nil, errors.New("required field (password) should be a string of 6 to 128 characters in length")
	}

	return &body, nil
}

func UserSignIn(body UserSigninBody) (*UserSigninBody, error) {
	var validEmail bool = utils.IsValidEmail(body.Email)

	// check if email is valid
	if !validEmail {
		return nil, errors.New("required field (email) should be a valid email string")
	}

	var validPassword bool = utils.StringOfLength(body.Password, 6, 128)

	// check if password is valid
	if !validPassword {
		return nil, errors.New("required field (password) should be a string of 6 to 128 characters in length")
	}

	return &body, nil
}
