import { PublicUser } from './user';

export interface Video {
  id: string;

  title: string;
  description: string;
  public: boolean;
  tags: string;
  filename: string;

  owner: PublicUser;

  dislikesCount: number;
  likesCount: number;

  isLiked: boolean;
  isDisliked: boolean;

  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}
