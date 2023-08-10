import { PublicUser } from './user';

export interface Video {
  id: string;
  title: string;
  description: string;
  public: boolean;
  owner: PublicUser;
  tags: string;
  filename: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
