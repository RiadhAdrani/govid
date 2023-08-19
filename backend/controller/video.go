package controller

import (
	"backend/config"
	"backend/middleware"
	"backend/schema"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ? should always be a multiple of 24 to avoid corrupted bytes with padding
const CHUNK_SIZE = 24 * 1000 * 50

const UPLOADING = "uploading"
const DONE = "done"
const FAILED = "failed"
const PROCESSING = "processing"

var DIR, _ = os.Getwd()
var UPLOAD_DIR = fmt.Sprintf("%s/public/upload", DIR)
var WATCH_DIR = fmt.Sprintf("%s/public/watch", DIR)

func CreateChunkRange(videoId int) (UploadVideoChunkResponse, error) {
	body := UploadVideoChunkResponse{}

	task := schema.VideoUploadTask{}

	res := config.DB.Where("video_id = ? AND status = ?", videoId, UPLOADING).First(&task)

	if res.Error != nil {
		return body, errors.New("in progress video upload task was not found")
	}

	body.From = task.Uploaded
	body.To = int64(math.Min(float64(body.From+CHUNK_SIZE), float64(task.Size)))
	body.TaskId = task.Id

	return body, nil
}

func MakeTaskDirectoryPath(task *schema.VideoUploadTask) string {
	return fmt.Sprintf("%s/public/upload/%d", DIR, task.Id)
}

func CleanTaskUploadFolder(id int) {
	// delete the folder of the task dir
	os.RemoveAll(fmt.Sprintf("%s/%d", UPLOAD_DIR, id))
}

func StartVideoUpload(c *gin.Context) {
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

	var body StartVideoUploadBody

	err := c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to read body",
			"details": err.Error(),
		})

		return
	}

	vBody, err := ValidateStartVideoUpload(body)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	// calculate the minimum duration for a view
	var MinViewDuration float64 = 30

	if vBody.Duration <= 30 {
		MinViewDuration = vBody.Duration * 0.9
	}

	// create a new video entry
	newVideo := schema.Video{
		Title:           vBody.Title,
		Public:          false,
		Owner:           user,
		Duration:        vBody.Duration,
		MinViewDuration: MinViewDuration,
	}

	res := config.DB.Create(&newVideo)

	if res.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": res.Error.Error(),
		})

		return
	}

	// create a new task
	newTask := schema.VideoUploadTask{
		Status:   UPLOADING,
		Size:     vBody.Size,
		Uploaded: 0,
		Filename: vBody.Filename,
		VideoAction: schema.VideoAction{
			Video:  newVideo,
			Action: schema.Action{User: user},
		},
	}

	res = config.DB.Create(&newTask)

	if res.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": res.Error.Error(),
		})

		return
	}

	next, err := CreateChunkRange(newVideo.Base.Id)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"next": next,
		"data": newTask,
	})
}

func FailVideoUploadTask(taskId int) {
	task := schema.VideoUploadTask{}

	// get task
	res := config.DB.First(&task, taskId)

	CleanTaskUploadFolder(task.Id)

	if res.Error != nil {
		return
	}

	task.Status = FAILED

	config.DB.Save(&task)
}

func ProcessVideo(taskId int) {
	task := schema.VideoUploadTask{}

	// get task
	res := config.DB.First(&task, taskId)

	if res.Error != nil {
		FailVideoUploadTask(task.Id)
		return
	}

	// get video
	video := schema.Video{}

	res = config.DB.First(&video, task.VideoId)

	if res.Error != nil {
		FailVideoUploadTask(task.Id)
		return
	}

	taskDir := MakeTaskDirectoryPath(&task)

	// get all files
	var chunks []schema.VideoUploadChunk

	config.DB.Where("video_id = ?", video.Id).Find(&chunks)

	// map to chunks paths

	var mergedBytes []byte

	for _, chunk := range chunks {
		path := fmt.Sprintf("%s/%s", taskDir, chunk.Filename)

		fileBytes, err := os.ReadFile(path)

		if err != nil {
			FailVideoUploadTask(task.Id)
			return
		}

		mergedBytes = append(mergedBytes, fileBytes...)
	}

	// file name
	extension := path.Ext(task.Filename)

	filename := fmt.Sprintf("%d%s", video.Id, extension)

	dst := fmt.Sprintf("%s/public/watch/%s", DIR, filename)

	// create a file
	err := os.WriteFile(dst, mergedBytes, 0644)

	if err != nil {
		FailVideoUploadTask(task.Id)
		return
	}

	// set the file name of the video
	video.Filename = filename

	config.DB.Save(&video)

	// delete the folder of the task dir
	CleanTaskUploadFolder(task.Id)

	task.Status = DONE

	config.DB.Save(&task)
}

func UploadVideoChunk(c *gin.Context) {
	user, video, err := BeforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
	}

	var body UploadVideoChunkBody

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"details": body,
		})

		return
	}

	vBody, err := ValidateUploadVideoChunk(body)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	// find task
	task := schema.VideoUploadTask{}

	res := config.DB.Where("id = ? AND status = ?", vBody.TaskId, UPLOADING).First(&task, vBody.TaskId)

	if res.Error != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload",
		})

		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "could not resume upload",
		})

		return
	}

	taskDir := MakeTaskDirectoryPath(&task)

	chunkName := fmt.Sprintf("chunk-%d@%d-%d", task.Id, vBody.From, vBody.To)

	if vBody.From == 0 {
		// create a new directory
		os.Mkdir(taskDir, os.ModeDir|os.ModePerm)
	} else {
		// validated with latest chunk
		lastChunk := schema.VideoUploadChunk{}

		res := config.DB.Where("video_id = ?", video.Id).Last(&lastChunk)

		if res.Error != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "could not resume upload (unable to find latest chunk)",
			})

			return
		}

		if lastChunk.To != vBody.From {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "could not resume upload (invalid chunk)",
			})

			return
		}
	}

	_, err = os.Stat(taskDir)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload (unable to upload chunks)",
		})

		return
	}

	dst := fmt.Sprintf("%s/%s", taskDir, chunkName)

	bytes, err := base64.StdEncoding.DecodeString(vBody.Bytes)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
			"msg":   "could not resume upload (unable to decode chunk)",
		})

		return
	}

	// add file
	err = os.WriteFile(dst, bytes, 0644)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload (unable to upload chunks)",
		})
	}

	// update progress in task
	task.Uploaded = vBody.To

	newChunk := schema.VideoUploadChunk{
		From:     vBody.From,
		To:       vBody.To,
		Filename: chunkName,
		VideoAction: schema.VideoAction{
			VideoId: video.Id,
			Action: schema.Action{
				UserId: user.Id,
			},
		},
	}

	res = config.DB.Save(&newChunk)

	if res.Error != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload (unable to save chunk)",
		})
		return
	}

	res = config.DB.Save(&task)

	if res.Error != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload (unable to update progress)",
		})
		return
	}

	next, err := CreateChunkRange(task.VideoId)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "could not resume upload (unable to calculate next chunk)",
		})
		return
	}

	// check if upload is still in progress
	if next.To < task.Size {
		c.JSON(http.StatusCreated, gin.H{
			"data": task,
			"next": next,
		})

		return
	}

	// we are processing the video
	task.Status = PROCESSING

	config.DB.Save(&task)

	// run in a seperate goroutine
	go ProcessVideo(task.Id)

	c.JSON(http.StatusCreated, gin.H{
		"msg":  "Upload complete, video is processing",
		"data": task,
	})

}

func GetVideoUploadProgress(c *gin.Context) {
	_, video, err := BeforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	task := schema.VideoUploadTask{}

	res := config.DB.Preload("Video").Where("video_id = ?", video.Id).Last(&task)

	if res.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": task,
	})
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

	var views int64
	config.DB.Model(&schema.VideoView{}).Where("video_id", video.Id).Count(&views)
	video.Views = views

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

func BeforeVideoAction(c *gin.Context, doNeedUser bool) (schema.User, schema.Video, error) {
	user := schema.User{}
	video := schema.Video{}

	// convert videoId to int
	videoId, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		return user, video, errors.New("invalid video id")
	}

	// check if user already exists with auth middleware
	_user, exists := c.Get("user")

	if !exists && doNeedUser {
		return user, video, errors.New("user not found")
	}

	user, ok := _user.(schema.User)

	if !ok && doNeedUser {
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
	user, video, err := BeforeVideoAction(c, true)

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
	user, video, err := BeforeVideoAction(c, true)

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

func AddWatchTime(c *gin.Context) {
	user, video, _ := BeforeVideoAction(c, false)

	if video.Id == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "video not found", "id": video.Id})
		return
	}

	var body []AddWatchTimeBody

	err := c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid body", "body": body})
		return
	}

	for _, segment := range body {

		if segment.To < segment.From {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid segment"})
			return
		}

		watchTime := schema.VideoWatchTime{
			From: segment.From,
			To:   segment.To,
			Time: segment.To - segment.From,
			AnonymousVideoAction: schema.AnonymousVideoAction{
				UserId:  user.Id,
				VideoId: video.Id,
			},
		}

		// add watch time to entry
		config.DB.Create(&watchTime)
	}

	c.JSON(http.StatusOK, gin.H{"msg": "done"})
}

func AddView(c *gin.Context) {
	_, video, _ := BeforeVideoAction(c, false)

	if video.Id == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "video not found", "id": video.Id})
		return
	}

	user := middleware.GetUserFromContext(c)

	if user.Id != 0 {
		var viewsCount int64 = 0

		config.DB.Model(&schema.VideoView{}).Where("video_id = ? AND user_id = ?", video.Id, user.Id).Count(&viewsCount)

		if viewsCount >= 1 {
			c.JSON(http.StatusAlreadyReported, gin.H{"msg": "max views reached by the same user"})
			return
		}
	}

	view := schema.VideoView{
		AnonymousVideoAction: schema.AnonymousVideoAction{
			UserId:  user.Id,
			VideoId: video.Id,
		},
	}

	res := config.DB.Save(&view)

	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error(), "msg": "couldn't add view"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}
