export const createUsersTableSQL = `
  CREATE TABLE IF NOT EXISTS Users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
  );
`;

export const createLinksTableSQL = `
  CREATE TABLE IF NOT EXISTS Links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT DEFAULT '',
    savedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isPublic BOOLEAN NOT NULL DEFAULT FALSE,
    userId INTEGER NOT NULL REFERENCES Users(id)
  );
`;

export const createLinkTagsTableSQL = `
  CREATE TABLE IF NOT EXISTS LinkTags(
    linkId INTEGER NOT NULL,
    tagId INTEGER NOT NULL,
    PRIMARY KEY(linkId, tagId),
    FOREIGN KEY(linkId) REFERENCES Links(id),
    FOREIGN KEY(tagId) REFERENCES Tags(id)
  );
`;

export const createTagsTableSQL = `
  CREATE TABLE IF NOT EXISTS Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`;
