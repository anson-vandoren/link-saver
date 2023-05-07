export type User = {
  username: string;
  id?: number;
  password?: string;
};

export type Tag = string;

export type Link = {
  description: string;
  id: number;
  url: string;
  title: string;
  tags: Tag[];
  isPublic: boolean;
  savedAt: string;
  userId?: number;
  User?: User;
};

export type ScrapeFQDNResponseData = {
  title: string;
  description: string;
  url: string;
};

export type GetLinksResponse = {
  links: Link[];
  totalPages: number;
};

export type CreateLinkRequest = {
  url: string;
  title?: string;
  tags?: Tag[];
  description?: string;
  isPublic?: boolean;
};

export type RegisterUserResponse = {
  message: string;
  user: User;
  token: string;
};

export type LoginUserResponse = {
  message?: string;
  token?: string;
  error?: { message: string }
};

export type ErrorResponse = {
  error: string;
};

export type WebSocketMessage = {
  type: string;
  data: unknown;
};
