package main

import (
	"backend/config"
	user "backend/routes"
	"io"
	"os"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"net/http"

	_ "backend/docs" // Import generated docs file

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID   int64  `bun:"id,pk,autoincrement"`
	Name string `bun:"name,notnull"`
}

type HealthCheckResponse struct {
	Result string `json:"result" example:"ok"`
}

// GET /video
// Summary: Stream a video
// Description: Streams a video file to the client.
// Produces:
//   - video/mp4
//
// Responses:
//
//	200: OK
//	500: InternalServerError
func streamVideo(c *gin.Context) {
	// Open the video file
	file, err := os.Open("./public/video.mp4")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open video file"})
		return
	}
	defer file.Close()

	// Get file information
	fileInfo, err := file.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get video file information"})
		return
	}

	// Set the content type header
	c.Header("Content-Type", "video/mp4")
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))

	// Serve the video content
	//http.ServeContent(c.Writer, c.Request, fileInfo.Name(), fileInfo.ModTime(), file)
	// Stream the video content
	c.Stream(func(w io.Writer) bool {
		// Define the buffer size for each chunk (adjust as needed)
		bufferSize := 1024 * 64

		// Create a buffer to hold the chunk data
		buffer := make([]byte, bufferSize)

		// Read a chunk from the file
		bytesRead, err := file.Read(buffer)
		if err != nil {
			return false // Stop streaming on error or EOF
		}

		// Write the chunk to the response writer
		_, err = w.Write(buffer[:bytesRead])
		if err != nil {
			return false // Stop streaming on write error
		}

		// Flush the response writer to ensure the chunk is sent immediately
		c.Writer.Flush()

		return bytesRead == bufferSize // Continue streaming if there's more data
	})
}

// @title			GoVid!
// @version		0.0.1
// @description	The successor of Youtube!
// @host			localhost:8080
// @BasePath		/
func main() {

	router := gin.New()
	router.Use(cors.Default())

	config.ConntectDB()
	config.ConnectCache()

	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	//	@Summary		Ping the server
	//	@Description	Returns a successful ping response
	//	@Tags			ping
	//	@Accept			json
	//	@Produce		json
	//	@Success		200	{object}	PingResponse
	//	@Router			/ping [get]
	router.GET("/ping", func(context *gin.Context) {
		context.JSON(200, gin.H{
			"message": "ping successful",
		})
	})

	router.GET("/video", streamVideo)

	// users
	user.UserRoutes(router)

	router.Run() // listen and serve on 0.0.0.0:8080
}
