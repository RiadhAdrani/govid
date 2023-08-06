package validators

import (
	"errors"
	"mime/multipart"
)

type UploadVideoBody struct {
	File *multipart.FileHeader `json:"file" binding:"required"`
}

func VideoUpload(body UploadVideoBody) (*UploadVideoBody, error) {

	if body.File == nil {
		return nil, errors.New("required field (file) is missing")
	}

	return &body, nil
}
