package controller

import (
	"errors"
	"strings"
)

type StartVideoUploadBody struct {
	Filename string  `json:"filename" binding:"required"`
	Title    string  `json:"title" binding:"required"`
	Size     int64   `json:"size" binding:"required"`
	Duration float64 `json:"duration" binding:"required"`
}

type UploadVideoChunkBody struct {
	Bytes  string `json:"bytes" binding:"required"`
	From   int64  `json:"from"`
	To     int64  `json:"to" binding:"required"`
	TaskId int    `json:"taskId" binding:"required"`
}

func ValidateUploadVideoChunk(body UploadVideoChunkBody) (*UploadVideoChunkBody, error) {
	if body.From > body.To {
		return nil, errors.New("invalid chunk range")
	}

	return &body, nil
}

func ValidateStartVideoUpload(body StartVideoUploadBody) (*StartVideoUploadBody, error) {
	trimmedTitle := strings.TrimSpace(body.Title)

	if trimmedTitle == "" {
		return nil, errors.New("required field (title) is missing")
	}

	body.Title = trimmedTitle

	if body.Size <= 0 {
		return nil, errors.New("invalid file size")
	}

	return &body, nil
}

type UploadVideoChunkResponse struct {
	From   int64 `json:"from" binding:"required"`
	To     int64 `json:"to" binding:"required"`
	TaskId int   `json:"taskId" binding:"required"`
}
