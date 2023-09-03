export interface Base {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | undefined;
}

export interface Action extends Base {
  userId: number;
}

export interface Rateable {
  isLiked: boolean;
  isDisliked: boolean;
  isHearted: boolean;
  likeCount: number;
  dislikeCount: number;
}
