import { ApiResponse } from './api';
import { Action, Base } from './common';
import { PublicUser } from './user';

export enum UploadState {
  Uploading = 'uploading',
  Done = 'done',
  Failed = 'failed',
  Processing = 'processing',
}

export interface Video extends Base {
  title: string;
  description: string;
  public: boolean;
  tags: string;
  filename: string;

  owner: PublicUser;

  duration: number;
  minViewDuration: number;

  views: number;

  dislikesCount: number;
  likesCount: number;

  isLiked: boolean;
  isDisliked: boolean;
}

export interface VideoAction extends Action {
  videoId: number;
  user: PublicUser;
}

export interface UploadBody {
  filename: string;
  title: string;
  size: number;
  duration: number;
}

export interface UploadChunkBody {
  from: number;
  to: number;
  bytes: string;
  taskId: number;
}

export interface UploadChunkResponse {
  next?: UploadNextChunk;
  data: UploadTask;
  msg?: string;
}

export type UploadProgressResponse = ApiResponse<UploadTask>;

export interface UploadTask extends VideoAction {
  status: UploadState;
  uploaded: number;
  size: number;
  filename: string;
}

export interface UploadNextChunk {
  from: number;
  to: number;
  taskId: number;
}

export interface VideoComment extends VideoAction {
  text: string;
}

export type CreateVideoCommentBody = Pick<VideoComment, 'text'>;
export type CreateVideoCommentResponse = ApiResponse<VideoComment>;

export type UpdateVideoCommentBody = Pick<VideoComment, 'text'>;
export type UpdateVideoCommentResponse = ApiResponse<VideoComment>;

export type GetVideoCommentResponse = ApiResponse<
  Array<VideoComment>,
  { totalCount: number; pinned?: VideoComment }
>;
