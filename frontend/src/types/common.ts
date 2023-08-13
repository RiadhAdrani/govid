export interface Base {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | undefined;
}

export interface Action extends Base {
  userId: number;
}
