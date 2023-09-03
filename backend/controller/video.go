package controller

import (
	"backend/config"
	"backend/middleware"
	"backend/schema"
	"backend/utils"
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
	user, video, err := beforeVideoAction(c, true)

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
	_, video, err := beforeVideoAction(c, true)

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

func beforeVideoAction(c *gin.Context, doNeedUser bool) (schema.User, schema.Video, error) {
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
	user, video, err := beforeVideoAction(c, true)

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
	user, video, err := beforeVideoAction(c, true)

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
	user, video, _ := beforeVideoAction(c, false)

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
	_, video, _ := beforeVideoAction(c, false)

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

type CreateCommentBody struct {
	Text string `json:"text" binding:"required"`
}

func CreateComment(c *gin.Context) {
	user, video, err := beforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "msg": "unable to create comment"})
		return
	}

	body := CreateCommentBody{}

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "msg": "invalid body"})
		return
	}

	comment := schema.VideoComment{
		Text: body.Text,
		VideoAction: schema.VideoAction{
			VideoId: video.Id,
			Action: schema.Action{
				UserId: user.Id,
			},
		},
	}

	res := config.DB.Save(&comment)

	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error(), "msg": "unable to write into database"})
		return
	}

	comment.User = user
	comment.Video = video

	c.JSON(http.StatusCreated, gin.H{"data": comment, "msg": "comment created successfully"})
}

func GetComment(id int, c *gin.Context) (schema.VideoComment, error) {
	_, video, err := beforeVideoAction(c, false)

	user := middleware.GetUserFromContext(c)

	comment := schema.VideoComment{}

	if err != nil {
		return comment, err
	}

	err = config.DB.Model(&schema.VideoComment{}).
		Preload("User").
		Select(`
			video_comments.id,
			video_comments.text,
			video_comments.created_at,
			video_comments.updated_at,
			video_comments.deleted_at,
			video_comments.user_id,
			video_comments.video_id,
			video_comments.is_hearted,
			like_counts.like_count,
			dislike_counts.dislike_count,
			reply_counts.reply_count,
			COALESCE(like_counts.like_count, 0) AS like_count,
			COALESCE(dislike_counts.dislike_count, 0) AS dislike_count,
			COALESCE(reply_counts.reply_count, 0) AS reply_count,
			COALESCE(liked_by_user.liked, false) AS is_liked,
						COALESCE(disliked_by_user.disliked, false) AS is_disliked
			`).
		Joins(`
				LEFT JOIN (
						SELECT comment_id, COUNT(*) AS like_count FROM video_comment_likes
						WHERE deleted_at IS NULL
						GROUP BY comment_id
				) AS like_counts ON video_comments.id = like_counts.comment_id
			`).
		Joins(`
				LEFT JOIN (
						SELECT comment_id, COUNT(*) AS dislike_count FROM video_comment_dis_likes
						WHERE deleted_at IS NULL
						GROUP BY comment_id
				) AS dislike_counts ON video_comments.id = dislike_counts.comment_id
			`).
		Joins(`
				LEFT JOIN (
						SELECT comment_id, COUNT(*) AS reply_count FROM video_comment_replies
						WHERE deleted_at IS NULL
						GROUP BY comment_id
				) AS reply_counts ON video_comments.id = reply_counts.comment_id
			`).
		Joins(`
				LEFT JOIN (
						SELECT comment_id, true AS liked FROM video_comment_likes
						WHERE user_id = ? AND deleted_at IS NULL
						GROUP BY comment_id
				) AS liked_by_user ON video_comments.id = liked_by_user.comment_id
			`, user.Id).
		Joins(`
				LEFT JOIN (
						SELECT comment_id, true AS disliked FROM video_comment_dis_likes
						WHERE user_id = ? AND deleted_at IS NULL
						GROUP BY comment_id
				) AS disliked_by_user ON video_comments.id = disliked_by_user.comment_id
			`, user.Id).
		Where("video_comments.video_id = ?", video.Id).
		Group(`
				video_comments.id,
				video_comments.text,
				video_comments.created_at,
				video_comments.updated_at,
				video_comments.deleted_at,
				video_comments.user_id,
				video_comments.video_id,
				video_comments.is_hearted,
				like_counts.like_count,
				dislike_counts.dislike_count,
				reply_counts.reply_count,
				liked_by_user.liked,
				disliked_by_user.disliked
			`).
		First(&comment).Error

	if err != nil {
		return comment, err
	}

	return comment, nil
}

func GetComments(c *gin.Context) {
	_, video, err := beforeVideoAction(c, false)

	user := middleware.GetUserFromContext(c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "couldn't fetch comments"})
		return
	}

	// get query params
	rFrom := c.DefaultQuery("from", "0")
	rCount := c.Query("count")

	from, err := strconv.Atoi(rFrom)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "invalid page start"})
		return
	}

	count, err := strconv.Atoi(rCount)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "invalid page end"})
		return
	}

	var commentsCount int64

	err = config.DB.Model(&schema.VideoComment{}).Where("video_id = ?", video.Id).Count(&commentsCount).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err, "msg": "something went wrong..."})
		return
	}

	var comments = []schema.VideoComment{}

	err = config.DB.Model(&schema.VideoComment{}).
		Preload("User").
		Limit(count).
		Offset(from).
		Select(`
		video_comments.id,
		video_comments.text,
		video_comments.created_at,
		video_comments.updated_at,
		video_comments.deleted_at,
		video_comments.user_id,
		video_comments.video_id,
		video_comments.is_hearted,
		like_counts.like_count,
		dislike_counts.dislike_count,
		reply_counts.reply_count,
		COALESCE(like_counts.like_count, 0) AS like_count,
		COALESCE(dislike_counts.dislike_count, 0) AS dislike_count,
		COALESCE(reply_counts.reply_count, 0) AS reply_count,
		COALESCE(liked_by_user.liked, false) AS is_liked,
		COALESCE(disliked_by_user.disliked, false) AS is_disliked
	`).
		Joins(`
		LEFT JOIN (
				SELECT comment_id, COUNT(*) AS like_count FROM video_comment_likes
				WHERE deleted_at IS NULL
				GROUP BY comment_id
		) AS like_counts ON video_comments.id = like_counts.comment_id
	`).
		Joins(`
		LEFT JOIN (
				SELECT comment_id, COUNT(*) AS dislike_count FROM video_comment_dis_likes
				WHERE deleted_at IS NULL
				GROUP BY comment_id
		) AS dislike_counts ON video_comments.id = dislike_counts.comment_id
	`).
		Joins(`
		LEFT JOIN (
				SELECT comment_id, COUNT(*) AS reply_count FROM video_comment_replies
				WHERE deleted_at IS NULL
				GROUP BY comment_id
		) AS reply_counts ON video_comments.id = reply_counts.comment_id
	`).
		Joins(`
		LEFT JOIN (
				SELECT comment_id, true AS liked FROM video_comment_likes
				WHERE user_id = ? AND deleted_at IS NULL
				GROUP BY comment_id
		) AS liked_by_user ON video_comments.id = liked_by_user.comment_id
	`, user.Id).
		Joins(`
		LEFT JOIN (
				SELECT comment_id, true AS disliked FROM video_comment_dis_likes
				WHERE user_id = ? AND deleted_at IS NULL
				GROUP BY comment_id
		) AS disliked_by_user ON video_comments.id = disliked_by_user.comment_id
	`, user.Id).
		Where("video_comments.video_id = ?", video.Id).
		Group(`
		video_comments.id,
		video_comments.text,
		video_comments.created_at,
		video_comments.updated_at,
		video_comments.deleted_at,
		video_comments.user_id,
		video_comments.video_id,
		video_comments.is_hearted,
		like_counts.like_count,
		dislike_counts.dislike_count,
		reply_counts.reply_count,
		liked_by_user.liked,
		disliked_by_user.disliked
	`).
		Find(&comments).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err, "msg": "something went wrong..."})
		return
	}

	body := make(utils.Map)

	maybePinned := schema.VideoPinnedComment{}

	config.DB.Where("video_id = ?", video.Id).First(&maybePinned)

	pinned := schema.VideoComment{}

	if maybePinned.Id != 0 {
		pinned, err = GetComment(maybePinned.Id, c)

		if err == nil && pinned.Id != 0 {
			body["pinned"] = pinned.Id

			// check if the list contains the comment:
			containsPinned := false

			for _, it := range comments {
				if it.Id == pinned.Id {
					containsPinned = true
					break
				}
			}

			if !containsPinned {
				comments = append(comments, pinned)
			}

		}
	}

	body["data"] = comments
	body["totalCount"] = commentsCount

	c.JSON(http.StatusOK, body)
}

func DeleteComment(c *gin.Context) {
	user, video, err := beforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error(), "msg": "something went wrong..."})
		return
	}

	// parse comment id
	commentId, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error(), "msg": "something went wrong..."})
		return
	}

	// check that comment is existing
	comment := schema.VideoComment{}

	err = config.DB.First(&comment, commentId).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"err": err.Error(), "msg": "comment does not exist"})
		return
	}

	// check if user is the maker of the comment
	if comment.UserId != user.Id {
		c.JSON(http.StatusNotFound, gin.H{"msg": "comment does not exist"})
		return
	}

	// double check with the video
	if video.Id != comment.VideoId {
		c.JSON(http.StatusNotFound, gin.H{"msg": "comment does not exist "})
		return
	}

	// delete the comment
	err = config.DB.Delete(&comment).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "something went wrong..."})
		return
	}

	c.AbortWithStatus(http.StatusOK)
}

func UpdateComment(c *gin.Context) {

	// ? body type
	type UpdateCommentBody struct {
		Text string `json:"text" binding:"required"`
	}

	user, video, err := beforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error(), "msg": "something went wrong..."})
		return
	}

	// parse comment id
	commentId, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error(), "msg": "something went wrong..."})
		return
	}

	// check that comment is existing
	comment := schema.VideoComment{}

	err = config.DB.Preload("User").First(&comment, commentId).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"err": err.Error(), "msg": "comment does not exist"})
		return
	}

	// check if user is the maker of the comment
	if comment.UserId != user.Id {
		c.JSON(http.StatusNotFound, gin.H{"msg": "comment does not exist"})
		return
	}

	// double check with the video
	if video.Id != comment.VideoId {
		c.JSON(http.StatusNotFound, gin.H{"msg": "comment does not exist"})
		return
	}

	// parse body
	body := UpdateCommentBody{}

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error(), "msg": "unable to parse body"})
		return
	}

	comment.Text = body.Text

	err = config.DB.Save(&comment).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to update comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comment, "msg": "comment updated successfully"})
}

func PinComment(c *gin.Context) {
	// get user and video
	user, video, err := beforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	// check if user is the owner of the video
	if user.Id != video.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{"err": err.Error(), "msg": "you do not have the right to perform such action"})
		return
	}

	// get comment id
	id, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	// check if comment exist
	comment := schema.VideoComment{}

	err = config.DB.Preload("User").First(&comment, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"err": err.Error(), "msg": "comment not found"})
		return
	}

	pinned := schema.VideoPinnedComment{
		VideoCommentAction: schema.VideoCommentAction{
			VideoId:   video.Id,
			CommentId: comment.Id,
			Action: schema.Action{
				UserId: user.Id,
			},
		},
	}

	// delete all other pinned comments
	err = config.DB.Where("video_id = ?", video.Id).Delete(&schema.VideoPinnedComment{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove previously pinned comment"})
		return
	}

	// create new pin
	err = config.DB.Save(&pinned).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to pin comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "comment pinned", "data": comment})
}

func UnpinComment(c *gin.Context) {
	// get user and video
	user, video, err := beforeVideoAction(c, true)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	// check if user is the owner of the video
	if user.Id != video.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{"err": err.Error(), "msg": "you do not have the right to perform such action"})
		return
	}

	// get comment id
	id, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	// check if comment exist
	comment := schema.VideoComment{}

	err = config.DB.Preload("User").First(&comment, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"err": err.Error(), "msg": "comment not found"})
		return
	}

	// delete all pinned comments
	err = config.DB.Where("video_id = ?", video.Id).Delete(&schema.VideoPinnedComment{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove previously pinned comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "comment unpinned"})
}

func beforeVideoCommentAction(c *gin.Context) (schema.User, schema.Video, schema.VideoComment, error) {
	comment := schema.VideoComment{}

	_, video, err := beforeVideoAction(c, true)

	user := middleware.GetUserFromContext(c)

	if err != nil {
		return user, video, comment, err
	}

	// get comment id
	id, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		return user, video, comment, err
	}

	err = config.DB.Preload("User").First(&comment, id).Error

	if err != nil {
		return user, video, comment, err
	}

	return user, video, comment, nil
}

func LikeComment(c *gin.Context) {
	// get user and video
	user, video, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	commentLike := schema.VideoCommentLike{}

	// check if already liked
	config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).First(&commentLike)

	if commentLike.Id != 0 {
		c.JSON(http.StatusConflict, gin.H{"err": "comment already liked"})
		return
	}

	// delete user's dislike on the comment
	err = config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).Delete(&schema.VideoCommentDisLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove dislike"})
		return
	}

	// create a new like entry
	commentLike.VideoId = video.Id
	commentLike.UserId = user.Id
	commentLike.CommentId = comment.Id

	err = config.DB.Save(&commentLike).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to create like entry"})
		return
	}

	c.AbortWithStatus(http.StatusCreated)
}

func UnLikeComment(c *gin.Context) {
	// get user and video
	user, _, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	commentLike := schema.VideoCommentLike{}

	// check if already liked
	config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).First(&commentLike)

	if commentLike.Id == 0 {
		c.JSON(http.StatusConflict, gin.H{"err": "comment already not liked"})
		return
	}

	// delete user's dislike on the comment
	err = config.DB.Delete(&commentLike).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove like"})
		return
	}

	c.AbortWithStatus(http.StatusOK)
}

func DislikeComment(c *gin.Context) {
	// get user and video
	user, video, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	commentRating := schema.VideoCommentDisLike{}

	// check if already liked
	config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).First(&commentRating)

	if commentRating.Id != 0 {
		c.JSON(http.StatusConflict, gin.H{"err": "comment already disliked"})
		return
	}

	// delete user's dislike on the comment
	err = config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).Delete(&schema.VideoCommentLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove like"})
		return
	}

	// create a new like entry
	commentRating.VideoId = video.Id
	commentRating.UserId = user.Id
	commentRating.CommentId = comment.Id

	err = config.DB.Save(&commentRating).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to create like entry"})
		return
	}

	c.AbortWithStatus(http.StatusCreated)
}

func UnDislikeComment(c *gin.Context) {
	// get user and video
	user, _, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	commentRating := schema.VideoCommentDisLike{}

	// check if already liked
	config.DB.Where("user_id = ? AND comment_id = ?", user.Id, comment.Id).First(&commentRating)

	if commentRating.Id == 0 {
		c.JSON(http.StatusConflict, gin.H{"err": "comment already not disliked"})
		return
	}

	// delete user's dislike on the comment
	err = config.DB.Delete(&commentRating).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove dislike"})
		return
	}

	c.AbortWithStatus(http.StatusOK)
}

func ToggleHeartComment(c *gin.Context, value bool) {
	// get user and video
	user, video, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error()})
		return
	}

	// check if user is the owner of the video

	if user.Id != video.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{"msg": "you cannot heart this comment"})
		return
	}

	// check if already hearted
	if comment.IsHearted == value {
		c.JSON(http.StatusConflict, gin.H{"err": "comment already have the wanted heart status"})
		return
	}

	comment.IsHearted = value

	err = config.DB.Save(&comment).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to heart/unheart video"})
		return
	}

	c.AbortWithStatus(http.StatusOK)
}

type CreateReplyBody struct {
	Text string `json:"text" binding:"required"`
}

func CreateReply(c *gin.Context) {
	// get user and video
	user, video, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// body

	body := CreateReplyBody{}

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "msg": "invalid body"})
		return
	}

	// create reply
	reply := schema.VideoCommentReply{}

	reply.UserId = user.Id
	reply.VideoId = video.Id
	reply.CommentId = comment.Id
	reply.Text = body.Text

	err = config.DB.Save(&reply).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "msg": "unable to add new reply into the database"})
		return
	}

	reply.Video = video
	reply.User = user
	reply.Comment = comment

	c.JSON(http.StatusCreated, gin.H{"data": reply})
}

func GetReplyWithMetadata(id int, c *gin.Context) (schema.VideoCommentReply, error) {
	user := middleware.GetUserFromContext(c)

	reply := schema.VideoCommentReply{}

	err := config.DB.Model(&schema.VideoCommentReply{}).
		Preload("User").
		Select(`
        video_comment_replies.id,
        video_comment_replies.text,
        video_comment_replies.created_at,
        video_comment_replies.updated_at,
        video_comment_replies.deleted_at,
        video_comment_replies.user_id,
        video_comment_replies.video_id,
        video_comment_replies.comment_id,
        video_comment_replies.is_hearted,
        COALESCE(like_counts.like_count, 0) AS like_count,
        COALESCE(dislike_counts.dislike_count, 0) AS dislike_count,
        COALESCE(liked_by_user.liked, false) AS is_liked,
        COALESCE(disliked_by_user.disliked, false) AS is_disliked
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, COUNT(*) AS like_count FROM video_comment_reply_likes
                WHERE deleted_at IS NULL
                GROUP BY reply_id
        ) AS like_counts ON video_comment_replies.id = like_counts.reply_id
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, COUNT(*) AS dislike_count FROM video_comment_reply_dis_likes
                WHERE deleted_at IS NULL
                GROUP BY reply_id
        ) AS dislike_counts ON video_comment_replies.id = dislike_counts.reply_id
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, true AS liked FROM video_comment_reply_likes
                WHERE user_id = ? AND deleted_at IS NULL
                GROUP BY reply_id
        ) AS liked_by_user ON video_comment_replies.id = liked_by_user.reply_id
    `, user.Id).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, true AS disliked FROM video_comment_reply_dis_likes
                WHERE user_id = ? AND deleted_at IS NULL
                GROUP BY reply_id
        ) AS disliked_by_user ON video_comment_replies.id = disliked_by_user.reply_id
    `, user.Id).
		Where("video_comment_replies.id = ?", id).
		Group(`
        video_comment_replies.id,
        video_comment_replies.text,
        video_comment_replies.created_at,
        video_comment_replies.updated_at,
        video_comment_replies.deleted_at,
        video_comment_replies.user_id,
        video_comment_replies.video_id,
        video_comment_replies.comment_id,
        video_comment_replies.is_hearted,
        like_counts.like_count,
        dislike_counts.dislike_count,
        liked_by_user.liked,
        disliked_by_user.disliked
    `).
		First(&reply).Error

	if err != nil {
		return reply, err
	}

	return reply, nil
}

type UpdateReplyBody struct {
	Text string `json:"text" binding:"required"`
}

func UpdateReply(c *gin.Context) {
	// get user and video
	user, _, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// body
	body := UpdateReplyBody{}

	err = c.Bind(&body)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "msg": "invalid body"})
		return
	}

	// check if user can update reply
	if reply.UserId != user.Id {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error(), "msg": "cannot edit reply"})
		return
	}

	// update
	reply.Text = body.Text

	// save
	err = config.DB.Save(&reply).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "msg": "unable to update reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "updated successfully"})
}

func DeleteReply(c *gin.Context) {
	// get user and video
	user, _, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if user can update reply
	if reply.UserId != user.Id {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error(), "msg": "cannot delete reply"})
		return
	}

	// save
	err = config.DB.Delete(&reply, reply.Id).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "msg": "unable to delete reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "reply deleted successfully"})
}

func GetReplies(c *gin.Context) {
	_, _, err := beforeVideoAction(c, false)

	user := middleware.GetUserFromContext(c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "couldn't fetch replies"})
		return
	}

	// get comment
	comment := schema.VideoComment{}

	commentId, err := utils.GetIdParamFromContext("comment", c)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "msg": "comment not found"})
		return
	}

	err = config.DB.First(&comment, commentId).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "msg": "comment not found"})
		return
	}

	// get query params
	rFrom := c.DefaultQuery("from", "0")
	rCount := c.Query("count")

	from, err := strconv.Atoi(rFrom)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "invalid page start"})
		return
	}

	count, err := strconv.Atoi(rCount)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "msg": "invalid page end"})
		return
	}

	var totalCount int64

	err = config.DB.Model(&schema.VideoCommentReply{}).Where("comment_id = ?", comment.Id).Count(&totalCount).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err, "msg": "unable to retrieve replies count"})
		return
	}

	var replies = []schema.VideoCommentReply{}

	err = config.DB.Model(&schema.VideoCommentReply{}).
		Preload("User").
		Limit(count).
		Offset(from).
		Select(`
        video_comment_replies.id,
        video_comment_replies.text,
        video_comment_replies.created_at,
        video_comment_replies.updated_at,
        video_comment_replies.deleted_at,
        video_comment_replies.user_id,
        video_comment_replies.video_id,
        video_comment_replies.comment_id,
        video_comment_replies.is_hearted,
        COALESCE(like_counts.like_count, 0) AS like_count,
        COALESCE(dislike_counts.dislike_count, 0) AS dislike_count,
        COALESCE(liked_by_user.liked, false) AS is_liked,
        COALESCE(disliked_by_user.disliked, false) AS is_disliked
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, COUNT(*) AS like_count FROM video_comment_reply_likes
                WHERE deleted_at IS NULL
                GROUP BY reply_id
        ) AS like_counts ON video_comment_replies.id = like_counts.reply_id
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, COUNT(*) AS dislike_count FROM video_comment_reply_dis_likes
                WHERE deleted_at IS NULL
                GROUP BY reply_id
        ) AS dislike_counts ON video_comment_replies.id = dislike_counts.reply_id
    `).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, true AS liked FROM video_comment_reply_likes
                WHERE user_id = ? AND deleted_at IS NULL
                GROUP BY reply_id
        ) AS liked_by_user ON video_comment_replies.id = liked_by_user.reply_id
    `, user.Id).
		Joins(`
        LEFT JOIN (
                SELECT reply_id, true AS disliked FROM video_comment_reply_dis_likes
                WHERE user_id = ? AND deleted_at IS NULL
                GROUP BY reply_id
        ) AS disliked_by_user ON video_comment_replies.id = disliked_by_user.reply_id
    `, user.Id).
		Where("video_comment_replies.comment_id = ?", comment.Id).
		Group(`
        video_comment_replies.id,
        video_comment_replies.text,
        video_comment_replies.created_at,
        video_comment_replies.updated_at,
        video_comment_replies.deleted_at,
        video_comment_replies.user_id,
        video_comment_replies.video_id,
        video_comment_replies.comment_id,
        video_comment_replies.is_hearted,
        like_counts.like_count,
        dislike_counts.dislike_count,
        liked_by_user.liked,
        disliked_by_user.disliked
    `).
		Find(&replies).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err, "msg": "unable to retreive comment replies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": replies, "totalCount": totalCount})
}

func beforeReplyAction(c *gin.Context) (schema.User, schema.Video, schema.VideoComment, schema.VideoCommentReply, error) {
	reply := schema.VideoCommentReply{}

	user, video, comment, err := beforeVideoCommentAction(c)

	if err != nil {
		return user, video, comment, reply, err
	}

	// get reply id
	id, err := utils.GetIdParamFromContext("reply", c)

	if err != nil {
		return user, video, comment, reply, err
	}

	reply, err = GetReplyWithMetadata(id, c)

	if err != nil {
		return user, video, comment, reply, err
	}

	return user, video, comment, reply, nil
}

func LikeReply(c *gin.Context) {
	user, video, comment, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if already liked
	existingRating := schema.VideoCommentReplyLike{}

	config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).First(&existingRating)

	if existingRating.Id != 0 {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already rated"})
		return
	}

	// remove dislikes
	err = config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).Delete(&schema.VideoCommentReplyDisLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove old rating"})
		return
	}

	rating := schema.VideoCommentReplyLike{}

	rating.UserId = user.Id
	rating.ReplyId = reply.Id
	rating.VideoId = video.Id
	rating.CommentId = comment.Id

	// add like
	err = config.DB.Save(&rating).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to add rating"})
		return
	}

	reply.IsLiked = true
	reply.LikeCount++

	if reply.IsDisliked {
		reply.IsDisliked = false
		reply.DislikeCount--
	}

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply rated successfully"})
}

func UnlikeReply(c *gin.Context) {
	user, _, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if already liked
	existingRating := schema.VideoCommentReplyLike{}

	config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).First(&existingRating)

	if existingRating.Id == 0 {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already not rated"})
		return
	}

	// remove likes
	err = config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).Delete(&schema.VideoCommentReplyLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove rating"})
		return
	}

	reply.IsLiked = false
	reply.LikeCount--

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply unrated successfully"})
}

func DislikeReply(c *gin.Context) {
	user, video, comment, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if already liked
	existingDislike := schema.VideoCommentReplyDisLike{}

	config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).First(&existingDislike)

	if existingDislike.Id != 0 {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already rated"})
		return
	}

	// remove likes
	err = config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).Delete(&schema.VideoCommentReplyLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove old rating"})
		return
	}

	rating := schema.VideoCommentReplyDisLike{}

	rating.UserId = user.Id
	rating.ReplyId = reply.Id
	rating.VideoId = video.Id
	rating.CommentId = comment.Id

	// add like
	err = config.DB.Save(&rating).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to add rating"})
		return
	}

	reply.IsDisliked = true
	reply.DislikeCount++

	if reply.IsLiked {
		reply.IsLiked = false
		reply.LikeCount--
	}

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply rated successfully"})
}

func UnDislikeReply(c *gin.Context) {
	user, _, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if already liked
	existingRating := schema.VideoCommentReplyDisLike{}

	config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).First(&existingRating)

	if existingRating.Id == 0 {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already not rated"})
		return
	}

	// remove likes
	err = config.DB.Where("user_id = ? AND reply_id = ?", user.Id, reply.Id).Delete(&schema.VideoCommentReplyDisLike{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to remove rating"})
		return
	}

	reply.IsDisliked = false
	reply.DislikeCount--

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply unrated successfully"})
}

func HeartReply(c *gin.Context) {
	user, video, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if user is the owner of the video
	if user.Id != video.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{"msg": "cannot perform action"})
		return
	}

	// check if already hearted
	if reply.IsHearted {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already rated"})
		return
	}

	reply.IsHearted = true

	err = config.DB.Save(&reply).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to update reply rating"})
		return
	}

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply rated successfully"})
}

func UnHeartReply(c *gin.Context) {
	user, video, _, reply, err := beforeReplyAction(c)

	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"err": err.Error(), "msg": "something went wrong"})
		return
	}

	// check if user is the owner of the video
	if user.Id != video.OwnerId {
		c.JSON(http.StatusForbidden, gin.H{"msg": "cannot perform action"})
		return
	}

	// check if already hearted
	if !reply.IsHearted {
		c.JSON(http.StatusConflict, gin.H{"msg": "reply already not rated"})
		return
	}

	reply.IsHearted = false

	err = config.DB.Save(&reply).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error(), "msg": "unable to update reply rating"})
		return
	}

	// return updated reply
	c.JSON(http.StatusOK, gin.H{"data": reply, "msg": "reply unrated successfully"})
}
