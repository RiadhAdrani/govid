package controller

import (
	"backend/config"
	"backend/middleware"
	"backend/schema"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

func GetVideoMetaData(id int, userId int) (schema.Video, error) {
	var video schema.Video

	// check if video already exists
	config.DB.Preload("Owner").First(&video, id)

	if video.Id == 0 {
		return video, errors.New("video not found")
	}

	// sub count
	var subCount int64

	subCountResult := config.DB.Model(&schema.Subscription{}).Where("subscribed_id", video.Owner.Id).Count(&subCount)

	if subCountResult.Error != nil {
		return video, errors.New("could not get user subscribers count")
	}

	video.Owner.SubCount = int(subCount)

	// likes count
	var likesCount int64

	likesCountResult := config.DB.Model(&schema.VideoLike{}).Where("video_id", video.Id).Count(&likesCount)

	if likesCountResult.Error != nil {
		return video, errors.New("could not get video likes count")
	}

	video.LikesCount = int(likesCount)

	// likes count
	var dislikesCount int64

	dislikesCountResult := config.DB.Model(&schema.VideoDisLike{}).Where("video_id", video.Id).Count(&dislikesCount)

	if dislikesCountResult.Error != nil {
		return video, errors.New("could not get video dislikes count")
	}

	video.DisLikesCount = int(dislikesCount)

	if userId != 0 {
		like := schema.VideoLike{}
		config.DB.Where("video_id = ? AND user_id = ?", video.Id, userId).First(&like)
		video.IsLiked = like.Id != 0

		dislike := schema.VideoDisLike{}
		config.DB.Where("video_id = ? AND user_id = ?", video.Id, userId).First(&dislike)
		video.IsDisLiked = dislike.Id != 0
	}

	return video, nil
}

func GetVideo(c *gin.Context) {
	// convert id to int
	id, err := strconv.Atoi(c.Param("id"))

	user := middleware.GetUserFromContext(c)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
		return
	}

	video, err := GetVideoMetaData(id, user.Id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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

func BeforeVideoAction(c *gin.Context) (schema.User, schema.Video, error) {
	user := schema.User{}
	video := schema.Video{}

	// convert videoId to int
	videoId, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		return user, video, errors.New("invalid video id")
	}

	// check if user already exists with auth middleware
	_user, exists := c.Get("user")

	if !exists {
		return user, video, errors.New("user not found")
	}

	user, ok := _user.(schema.User)

	if !ok {
		return user, video, errors.New("user not found")
	}

	// check if video already exists
	config.DB.First(&video, videoId)

	if video.Id == 0 {
		return user, video, errors.New("video not found")
	}

	return user, video, nil
}

func LikeOrDislikeVideo(c *gin.Context, isLike bool) {
	user, video, err := BeforeVideoAction(c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check if video is already liked
	var videoLike schema.VideoLike

	config.DB.Where("user_id = ? AND video_id = ?", user.Id, video.Id).First(&videoLike)

	if videoLike.Id != 0 {
		if isLike {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video already liked"})
			return
		} else {
			config.DB.Delete(&videoLike)
		}
	}

	// check video is already disliked
	var videoDisLike schema.VideoDisLike

	config.DB.Where("user_id = ? AND video_id = ?", user.Id, video.Id).First(&videoDisLike)

	// if disliked, remove it
	if videoDisLike.Id != 0 {
		if !isLike {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video already disliked"})
			return
		} else {
			config.DB.Delete(&videoDisLike)
		}
	}

	newVideoAction := schema.VideoAction{
		VideoId: video.Id,
		Action: schema.Action{
			UserId: user.Id,
		},
	}

	var res *gorm.DB

	if isLike {
		// add new entry
		newVideoLike := schema.VideoLike{
			VideoAction: newVideoAction,
		}

		res = config.DB.Create(&newVideoLike)
	} else {
		// add new entry
		newVideoDisLike := schema.VideoDisLike{
			VideoAction: newVideoAction,
		}

		res = config.DB.Create(&newVideoDisLike)
	}

	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to perform rating action"})
		return
	}

	videoData, _ := GetVideoMetaData(video.Id, user.Id)

	// return ok
	c.JSON(http.StatusOK, gin.H{"msg": "Video liked", "data": videoData})
}

func UnLikeOrDislikeVideo(c *gin.Context, isLike bool) {
	user, video, err := BeforeVideoAction(c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if isLike {
		// check video is already disliked
		var videoLike schema.VideoLike

		config.DB.Where("user_id = ? AND video_id = ?", user.Id, video.Id).First(&videoLike)

		// if disliked, remove it
		if videoLike.Id == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video already not liked"})
			return
		} else {
			config.DB.Delete(&videoLike)
		}
	} else {
		// check video is already disliked
		var videoDisLike schema.VideoDisLike

		config.DB.Where("user_id = ? AND video_id = ?", user.Id, video.Id).First(&videoDisLike)

		// if disliked, remove it
		if videoDisLike.Id == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video already not disliked"})
			return
		} else {
			config.DB.Delete(&videoDisLike)
		}
	}

	videoData, _ := GetVideoMetaData(video.Id, user.Id)

	// return ok
	c.JSON(http.StatusOK, gin.H{"msg": "Video unrated successfully", "data": videoData})
}

func LikeVideo(c *gin.Context) {
	LikeOrDislikeVideo(c, true)
}

func DisLikeVideo(c *gin.Context) {
	LikeOrDislikeVideo(c, false)
}

func UnLikeVideo(c *gin.Context) {
	UnLikeOrDislikeVideo(c, true)
}

func UnDisLikeVideo(c *gin.Context) {
	UnLikeOrDislikeVideo(c, false)
}
