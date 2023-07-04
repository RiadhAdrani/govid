package config

import (
	"backend/schema"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	hostname := os.Getenv("DB_HOSTNAME")
	if hostname == "" {
		hostname = "govid_db"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "postgres"
	}

	dbAdmin := os.Getenv("DB_ADMIN")
	if dbAdmin == "" {
		dbAdmin = "postgres"
	}

	dbAdminPassword := os.Getenv("DB_ADMIN_PASSWORD")
	if dbAdminPassword == "" {
		dbAdminPassword = "postgres"
	}

	// Create the database connection string
	connectionString := "postgres://" + dbAdmin + ":" + dbAdminPassword + "@" + hostname + ":" + port + "/" + dbname

	db, err := gorm.Open(postgres.Open(connectionString))

	if err != nil {
		panic(err)
	}

	db.AutoMigrate(&schema.User{})

	DB = db

}

func SyncDB() {
	DB.AutoMigrate(&schema.User{})
}
