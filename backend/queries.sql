SELECT 
COUNT(video_comment_likes.id) AS like_count, 
COUNT(video_comment_dis_likes.id) AS dislike_count,
COUNT(video_replies.id) AS reply_count,
CASE WHEN SUM(CASE WHEN video_comment_likes.user_id = 1 THEN 1 ELSE 0 END) > 0 THEN true ELSE false END AS is_liked,
CASE WHEN SUM(CASE WHEN video_comment_dis_likes.user_id = 1 THEN 1 ELSE 0 END) > 0 THEN true ELSE false END AS is_disliked
video_comments.*, 
FROM video_comments 
LEFT JOIN video_comment_likes ON video_comments.id = video_comment_likes.comment_id 
LEFT JOIN video_comment_dis_likes ON video_comments.id = video_comment_dis_likes.comment_id 
LEFT JOIN video_replies ON video_comments.id = video_replies.comment_id
LEFT JOIN users ON video_comments.user_id = users.id
WHERE video_comments.video_id = 127 
GROUP BY video_comments.id;