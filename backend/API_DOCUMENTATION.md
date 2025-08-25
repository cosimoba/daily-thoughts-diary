# Daily Thoughts Diary API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "Password123!"
  }
  ```
- **Response:** User object with access and refresh tokens

#### Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** User object with access and refresh tokens

#### Refresh Token
- **POST** `/auth/refresh-token`
- **Body:**
  ```json
  {
    "refreshToken": "..."
  }
  ```
- **Response:** New access token

#### Request Password Reset
- **POST** `/auth/request-password-reset`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Reset Password
- **POST** `/auth/reset-password`
- **Body:**
  ```json
  {
    "token": "reset-token",
    "newPassword": "NewPassword123!"
  }
  ```

#### Get Current User
- **GET** `/auth/me`
- **Auth Required:** Yes
- **Response:** Current user object with settings

#### Update Password
- **PUT** `/auth/update-password`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "currentPassword": "current",
    "newPassword": "NewPassword123!"
  }
  ```

### Entries

#### Get All Entries
- **GET** `/entries`
- **Auth Required:** Yes
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` - Search in title and content
  - `mood` - Filter by mood
  - `startDate` - Filter by date range
  - `endDate` - Filter by date range
  - `tags` - Comma-separated tag names
  - `isFavorite` - Filter favorites (true/false)
  - `sortBy` - Sort field (createdAt, updatedAt, title)
  - `sortOrder` - Sort order (asc, desc)

#### Get Single Entry
- **GET** `/entries/:id`
- **Auth Required:** Yes

#### Create Entry
- **POST** `/entries`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "title": "Entry Title",
    "content": "Entry content...",
    "mood": "HAPPY",
    "privacy": "PRIVATE",
    "location": "New York",
    "weather": "sunny",
    "tags": ["work", "personal"],
    "isFavorite": false
  }
  ```

#### Update Entry
- **PUT** `/entries/:id`
- **Auth Required:** Yes
- **Body:** Same as create (all fields optional)

#### Delete Entry
- **DELETE** `/entries/:id`
- **Auth Required:** Yes

#### Toggle Favorite
- **PATCH** `/entries/:id/favorite`
- **Auth Required:** Yes

#### Search Entries
- **GET** `/entries/search`
- **Auth Required:** Yes
- **Query Parameters:**
  - `q` - Search query (required)
  - `page` (default: 1)
  - `limit` (default: 10)

#### Get Entry Statistics
- **GET** `/entries/stats`
- **Auth Required:** Yes
- **Query Parameters:**
  - `startDate` - Filter by date range
  - `endDate` - Filter by date range

### Users

#### Get User Profile
- **GET** `/users/profile/:id`
- **GET** `/users/profile` (own profile)
- **Auth Required:** Yes (for own profile)

#### Update Profile
- **PUT** `/users/profile`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com",
    "avatar": "https://..."
  }
  ```

#### Upload Avatar
- **POST** `/users/avatar`
- **Auth Required:** Yes
- **Body:** FormData with `avatar` field

#### Get User Settings
- **GET** `/users/settings`
- **Auth Required:** Yes

#### Update Settings
- **PUT** `/users/settings`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "theme": "dark",
    "defaultPrivacy": "PRIVATE",
    "emailNotifications": true,
    "dailyReminder": true,
    "reminderTime": "09:00",
    "language": "en",
    "timezone": "America/New_York"
  }
  ```

#### Get User Statistics
- **GET** `/users/stats`
- **Auth Required:** Yes

#### Export User Data
- **GET** `/users/export`
- **Auth Required:** Yes
- **Response:** JSON file download with all user data

#### Delete Account
- **DELETE** `/users/account`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "password": "current-password"
  }
  ```

### File Uploads

#### Upload Single File
- **POST** `/uploads/single`
- **Auth Required:** Yes
- **Body:** FormData with `file` field and optional `entryId`

#### Upload Multiple Files
- **POST** `/uploads/multiple`
- **Auth Required:** Yes
- **Body:** FormData with `files` field (max 5) and optional `entryId`

#### Get Attachment
- **GET** `/uploads/attachments/:id`
- **Auth Required:** Optional (based on entry privacy)

#### Delete Attachment
- **DELETE** `/uploads/attachments/:id`
- **Auth Required:** Yes

### Tags

#### Get All Tags
- **GET** `/tags`
- **Auth Required:** Yes
- **Query Parameters:**
  - `category` - Filter by category
  - `search` - Search tag names

#### Create Tag
- **POST** `/tags`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "name": "tag-name",
    "color": "#FF6B6B",
    "category": "TOPIC"
  }
  ```

#### Update Tag
- **PUT** `/tags/:id`
- **Auth Required:** Yes

#### Delete Tag
- **DELETE** `/tags/:id`
- **Auth Required:** Yes

### NLP Analysis

#### Analyze Text
- **POST** `/nlp/analyze`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "text": "Text to analyze...",
    "options": {
      "extractEntities": true,
      "detectSentiment": true,
      "generateTags": true
    }
  }
  ```

#### Get Suggested Tags
- **POST** `/nlp/suggest-tags`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "text": "Entry content..."
  }
  ```

## Response Formats

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- File uploads: 10 requests per hour

## File Upload Limits
- Max file size: 10MB
- Max files per upload: 5
- Allowed image types: JPEG, PNG, GIF, WebP
- Allowed document types: PDF, TXT, DOC, DOCX

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## WebSocket Events (Future)
- `entry:created` - New entry created
- `entry:updated` - Entry updated
- `entry:deleted` - Entry deleted
- `user:status` - User status change

## Health Check
- **GET** `/health` - Basic health check
- **GET** `/api/metrics` - Detailed metrics (admin only)

## Database Backup Scripts
```bash
# Create backup
npm run backup create

# List backups
npm run backup list

# Restore from backup
npm run restore from-file backups/backup_file.sql

# Restore latest
npm run restore latest
```

## Environment Variables
See `.env.example` for all required environment variables.

## Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

## Development
```bash
# Start development server
npm run dev

# Run database migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```