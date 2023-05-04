export type Tag = string;
export type Link = {
  id: number;
  url: string;
  title: string;
  tags: Tag[];
  isPublic: boolean;
  savedAt: string;
  userId: number;
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

export type User = {
  id: number;
  username: string;
};

export type RegisterUserResponse = {
  message: string;
  user: User;
  token: string;
};

export type LoginUserResponse = {
  message: string;
  token: string;
};

export type ErrorResponse = {
  error: string;
};

export type WebSocketMessage = {
  type: string;
  data: unknown;
};
