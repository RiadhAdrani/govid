package controller

import (
	"backend/config"
	"backend/schema"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func CreateVideo(c *gin.Context) {
	// single file
	file, _ := c.FormFile("file")

	u, exists := c.Get("user")

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User not found",
		})

		return
	}

	user, ok := u.(schema.User)

	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User not found",
		})

		return
	}

	extension := path.Ext(file.Filename)

	title := strings.TrimSuffix(file.Filename, extension)

	video := schema.Video{
		Title:    title,
		Public:   false,
		Owner:    user,
		Filename: file.Filename,
	}

	result := config.DB.Create(&video)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": result.Error.Error(),
		})

		return
	}

	filename := fmt.Sprintf("%d%s", video.Id, extension)

	UploadVideo(c, filename)

	video.Filename = filename

	config.DB.Save(&video)

	c.JSON(http.StatusOK, gin.H{"data": video})
}

func GetVideo(c *gin.Context) {
	// convert id to int
	id, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
		return
	}

	var video schema.Video

	// check if video already exists
	config.DB.Preload("Owner").First(&video, id)

	if video.Id == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": video})
}

func UploadVideo(c *gin.Context, filename string) {

	// single file
	file, _ := c.FormFile("file")

	dir, err := os.Getwd()

	if err != nil {
		c.String(http.StatusOK, "Upload failed")
	}

	dst := fmt.Sprintf("%s/public/watch/%s", dir, filename)

	// Upload the file to specific dst.
	c.SaveUploadedFile(file, dst)
}

func WatchVideo(c *gin.Context) {

	// convert id to int
	id, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
		return
	}

	var video schema.Video

	// check if video already exists
	config.DB.First(&video, id)

	if video.Id == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	dir, err := os.Getwd()

	if err != nil {
		c.String(http.StatusOK, "Upload failed")
		return
	}

	url := fmt.Sprintf("%s/public/watch/%s", dir, video.Filename)

	// Open the video file
	file, err := os.Open(url)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
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
	// allow streamin ranges
	c.Header("Accept-Ranges", "bytes")
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
