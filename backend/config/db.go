package config

import (
	"os"

	"backend/schema"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConntectDB() {
	db, err := gorm.Open(postgres.Open("postgres://postgres:postgres@localhost:5432/postgres"))

	if err != nil {
		panic(err)
	}

	DB = db

}

func SyncDB() {
	DB.AutoMigrate(&schema.User{})
}
