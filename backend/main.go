package main

import (
	"backend/config"
	"backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "backend/docs" // Import generated docs file

	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID   int64  `bun:"id,pk,autoincrement"`
	Name string `bun:"name,notnull"`
}

func Init() {
	config.ConnectDB()
	config.ConnectCache()

	config.SyncDB()
}

type HealthCheckResponse struct {
	Result string `json:"result" example:"ok"`
}

func main() {

	router := gin.New()
	router.Static("./public", "./public")
	router.MaxMultipartMemory = 8 << 20

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowCredentials = true
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	// corsConfig.AllowHeaders = []string{"Accept-Ranges: bytes"}
	corsConfig.AddAllowMethods("OPTIONS")

	router.Use(cors.New(corsConfig))

	Init()

	router.GET("/ping", func(context *gin.Context) {

		context.JSON(200, gin.H{
			"message": "ping successful",
		})
	})

	// routes
	routes.UserRoutes(router)
	routes.VideoRoutes(router)
	routes.PlaylistRoutes(router)

	router.Run() // listen and serve on 0.0.0.0:8080
}
