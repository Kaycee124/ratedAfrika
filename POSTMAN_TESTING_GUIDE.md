# Postman Testing Guide - Lyrics & Collaborators

This guide provides step-by-step instructions to test the recent changes:
1. **Lyrics Service** - Returns empty strings for missing lyrics fields
2. **Song Collaborators** - Returns collaborators array in song responses

## 📋 Table of Contents
- [Setup](#setup)
- [Authentication](#authentication)
- [Lyrics Testing](#lyrics-testing)
- [Songs with Collaborators Testing](#songs-with-collaborators-testing)
- [Expected Responses](#expected-responses)

---

## Setup

### Environment Variables
Create a Postman environment with these variables:

```
BASE_URL: http://localhost:3000  (or your server URL)
ACCESS_TOKEN: (will be set after login)
USER_ID: (will be set after login)
SONG_ID: (will be set after creating a song)
ARTIST_ID: (will be set after creating an artist)
COLLABORATOR_ID: (will be set after creating a collaborator)
```

---

## Authentication

### 1. Login / Register
**Endpoint:** `POST {{BASE_URL}}/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "name": "Test User",
      "subscription": "artist"
    }
  }
}
```

**⚠️ Important:** Save `accessToken` to `ACCESS_TOKEN` variable in Postman:
```javascript
// In Tests tab:
pm.environment.set("ACCESS_TOKEN", pm.response.json().data.accessToken);
pm.environment.set("USER_ID", pm.response.json().data.user.id);
```

---

## Lyrics Testing

### Test Case 1: Get Lyrics - No Lyrics Exist (404)

**Endpoint:** `GET {{BASE_URL}}/lyrics/song/{{SONG_ID}}`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (404 NOT FOUND):**
```json
{
  "statusCode": 404,
  "message": "No lyrics found"
}
```

**✅ Validation:**
- Status code is 404
- Uses custom `NotFoundException`
- Message is "No lyrics found" (not "Lyrics not found for this song")

---

### Test Case 2: Create Lyrics with Only Basic Text

**Endpoint:** `POST {{BASE_URL}}/lyrics`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "songId": "{{SONG_ID}}",
  "basicLyrics": "Verse 1:\nThis is my song\nWith beautiful lyrics\n\nChorus:\nSinging all day long",
  "synchronizedLyrics": []
}
```

**Expected Response (201 CREATED):**
```json
{
  "statusCode": 201,
  "message": "Lyrics created successfully",
  "data": {
    "id": "lyrics-uuid",
    "songId": "song-uuid",
    "basicLyrics": "Verse 1:\nThis is my song...",
    "synchronizedLyrics": [],
    "version": 1,
    "isComplete": false,
    "createdAt": "2025-01-23T...",
    "updatedAt": "2025-01-23T..."
  }
}
```

---

### Test Case 3: Get Lyrics with Missing Synchronized Lyrics

**Endpoint:** `GET {{BASE_URL}}/lyrics/song/{{SONG_ID}}`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Lyrics retrieved successfully",
  "data": {
    "id": "lyrics-uuid",
    "songId": "song-uuid",
    "basicLyrics": "Verse 1:\nThis is my song...",
    "synchronizedLyrics": [],  // ✅ Returns empty array, not null
    "version": 1,
    "isComplete": false,
    "createdAt": "2025-01-23T...",
    "updatedAt": "2025-01-23T..."
  }
}
```

**✅ Validation:**
- `synchronizedLyrics` is an empty array `[]`, not `null` or missing

---

### Test Case 4: Create Lyrics with Only Synchronized Text

**Endpoint:** `POST {{BASE_URL}}/lyrics`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "songId": "{{SONG_ID_2}}",
  "basicLyrics": "",
  "synchronizedLyrics": [
    { "timestamp": 0, "text": "Verse 1:" },
    { "timestamp": 1000, "text": "This is my song" },
    { "timestamp": 3000, "text": "With beautiful lyrics" }
  ]
}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Lyrics retrieved successfully",
  "data": {
    "id": "lyrics-uuid",
    "songId": "song-uuid-2",
    "basicLyrics": "",  // ✅ Returns empty string, not null
    "synchronizedLyrics": [
      { "timestamp": 0, "text": "Verse 1:" },
      { "timestamp": 1000, "text": "This is my song" },
      { "timestamp": 3000, "text": "With beautiful lyrics" }
    ],
    "version": 1,
    "isComplete": false
  }
}
```

**✅ Validation:**
- `basicLyrics` is an empty string `""`, not `null` or missing

---

## Songs with Collaborators Testing

### Prerequisites: Create a Collaborator

**Endpoint:** `POST {{BASE_URL}}/collaborators`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Producer",
  "email": "producer@example.com",
  "role": "producer",
  "spotifyUrl": "https://open.spotify.com/artist/123",
  "appleUrl": "https://music.apple.com/artist/123"
}
```

**Expected Response (201 CREATED):**
```json
{
  "statusCode": 201,
  "message": "Collaborator created successfully",
  "data": {
    "id": "collaborator-uuid",
    "name": "John Producer",
    "email": "producer@example.com",
    "role": "producer",
    "spotifyUrl": "https://open.spotify.com/artist/123",
    "appleUrl": "https://music.apple.com/artist/123",
    "createdAt": "2025-01-23T..."
  }
}
```

**Save to environment:**
```javascript
pm.environment.set("COLLABORATOR_ID", pm.response.json().data.id);
```

---

### Test Case 5: Get Song Details with Collaborators

**Endpoint:** `GET {{BASE_URL}}/songs/{{SONG_ID}}`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Song details retrieved successfully",
  "data": {
    "id": "song-uuid",
    "title": "My Amazing Song",
    "releaseType": "SINGLE",
    "releaseLanguage": "English",
    "label": "Independent",
    "primaryGenre": "Pop",
    "secondaryGenres": ["R&B", "Soul"],
    "recordingYear": 2024,
    "isExplicit": false,
    "status": "DRAFT",
    
    // ✅ NEW: Collaborators array
    "collaborators": [
      {
        "name": "John Producer",
        "email": "producer@example.com",
        "role": "producer"
      },
      {
        "name": "Jane Writer",
        "email": "writer@example.com",
        "role": "writer"
      }
    ],
    
    // File paths
    "coverArtPath": "http://localhost:3000/storage/files/cover-uuid",
    "masterTrackPath": "http://localhost:3000/storage/files/track-uuid",
    
    // Primary artist
    "primaryArtist": {
      "id": "artist-uuid",
      "name": "Test Artist",
      "email": "artist@example.com"
    },
    
    // Featured artists
    "featuredPlatformArtists": [],
    "featuredTempArtists": [],
    
    // ✅ Split sheet info (if exists)
    "currentSplitSheetId": "splitsheet-uuid",
    "currentSplitSheet": {
      "id": "splitsheet-uuid",
      "status": "Active",
      "entries": [
        {
          "id": "entry-uuid",
          "recipientEmail": "producer@example.com",
          "recipientName": "John Producer",
          "percentage": 25.00,
          "status": "Active"
        }
      ]
    },
    
    "createdAt": "2025-01-23T...",
    "updatedAt": "2025-01-23T..."
  }
}
```

**✅ Validation:**
- `collaborators` array exists and contains `{ name, email, role }` objects
- `currentSplitSheet.entries` exists (shows split sheet collaborators)
- Both are returned in the same response

---

### Test Case 6: Query Songs (Get All User Songs)

**Endpoint:** `GET {{BASE_URL}}/songs?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Songs retrieved successfully",
  "data": {
    "songs": [
      {
        "id": "song-uuid-1",
        "title": "First Song",
        "primaryGenre": "Pop",
        
        // ✅ Collaborators in list view
        "collaborators": [
          {
            "name": "John Producer",
            "email": "producer@example.com",
            "role": "producer"
          }
        ],
        
        "primaryArtist": {
          "id": "artist-uuid",
          "name": "Test Artist"
        },
        
        // ✅ Split sheet included
        "currentSplitSheet": {
          "id": "splitsheet-uuid",
          "entries": [...]
        }
      },
      {
        "id": "song-uuid-2",
        "title": "Second Song",
        
        // ✅ Empty collaborators array if none exist
        "collaborators": [],
        
        "primaryArtist": {
          "id": "artist-uuid",
          "name": "Test Artist"
        },
        
        "currentSplitSheet": null
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 10
  }
}
```

**✅ Validation:**
- Every song has a `collaborators` array (even if empty)
- Every song has `currentSplitSheet` (null if none exists)

---

### Test Case 7: Get Songs by User

**Endpoint:** `GET {{BASE_URL}}/songs/userObject`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User songs retrieved successfully",
  "data": [
    {
      "id": "song-uuid",
      "title": "My Song",
      
      // ✅ Collaborators array
      "collaborators": [
        {
          "name": "John Producer",
          "email": "producer@example.com",
          "role": "producer"
        }
      ],
      
      // File paths
      "coverArtPath": "http://localhost:3000/storage/files/...",
      "masterTrackPath": "http://localhost:3000/storage/files/...",
      
      // Split sheet
      "currentSplitSheetId": "splitsheet-uuid",
      "currentSplitSheet": {
        "entries": [...]
      }
    }
  ]
}
```

---

### Test Case 8: Get Songs by Artist

**Endpoint:** `GET {{BASE_URL}}/songs/artist/{{ARTIST_ID}}`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Artist songs retrieved successfully",
  "data": [
    {
      "id": "song-uuid",
      "title": "Artist Song",
      
      // ✅ Collaborators array
      "collaborators": [
        {
          "name": "Jane Writer",
          "email": "writer@example.com",
          "role": "writer"
        },
        {
          "name": "John Producer",
          "email": "producer@example.com",
          "role": "producer"
        }
      ],
      
      "primaryArtist": {
        "id": "artist-uuid",
        "name": "Test Artist"
      },
      
      // Split sheet
      "currentSplitSheet": {
        "entries": [...]
      }
    }
  ]
}
```

---

## 🔍 Validation Checklist

### Lyrics Service Changes
- [ ] No lyrics exists → Returns 404 with message "No lyrics found"
- [ ] Missing `basicLyrics` → Returns empty string `""`
- [ ] Missing `synchronizedLyrics` → Returns empty array `[]`
- [ ] Uses `NotFoundException` from custom exceptions

### Collaborators in Songs
- [ ] `GET /songs/:id` returns `collaborators` array
- [ ] `GET /songs` returns `collaborators` array for each song
- [ ] `GET /songs/userObject` returns `collaborators` array
- [ ] `GET /songs/artist/:artistId` returns `collaborators` array
- [ ] Collaborators format: `{ name: string, email: string, role: string }`
- [ ] Empty collaborators returns `[]` not `null`
- [ ] `currentSplitSheet.entries` also included in responses

---

## 🧪 Advanced Testing Scenarios

### Scenario 1: Song with Multiple Collaborators
Create a song, add 3+ collaborators, verify all appear in response.

### Scenario 2: Song with Split Sheet but No Direct Collaborators
Create a song with split sheet entries but no collaborators in the join table.
- `collaborators` should be `[]`
- `currentSplitSheet.entries` should show split sheet data

### Scenario 3: Song with Both Collaborators and Split Sheet
Create a song with:
- 2 direct collaborators (join table)
- Split sheet with 3 entries
Verify both appear in the response.

### Scenario 4: Partial Lyrics Update
1. Create lyrics with only `basicLyrics`
2. Update to add `synchronizedLyrics`
3. GET lyrics - verify both fields exist
4. Update to remove `basicLyrics` (set to empty string)
5. GET lyrics - verify `basicLyrics` returns `""`

---

## 📝 Postman Collection Structure

```
Rated Afrika API Tests
├── 🔐 Authentication
│   ├── Register User
│   ├── Login User
│   └── Get User Profile
│
├── 🎵 Lyrics Tests
│   ├── Create Lyrics (Basic Only)
│   ├── Create Lyrics (Synced Only)
│   ├── Create Lyrics (Both)
│   ├── Get Lyrics - No Data (404)
│   ├── Get Lyrics - Basic Only
│   ├── Get Lyrics - Synced Only
│   └── Update Lyrics
│
└── 🎸 Songs with Collaborators
    ├── Prerequisites
    │   ├── Create Artist
    │   ├── Create Collaborator 1
    │   ├── Create Collaborator 2
    │   └── Create Song
    │
    ├── Get Song Details (with collaborators)
    ├── Query Songs (list with collaborators)
    ├── Get User Songs (with collaborators)
    └── Get Artist Songs (with collaborators)
```

---

## 🚀 Quick Start Script

Run these requests in order:

1. **Login** → Save `ACCESS_TOKEN`
2. **Create Artist** → Save `ARTIST_ID`
3. **Create Collaborators** → Save `COLLABORATOR_ID`
4. **Create Song** → Save `SONG_ID`
5. **Add Collaborators to Song** (via database or API if available)
6. **GET Song Details** → Verify `collaborators` array
7. **Create Lyrics (basic only)** → Save `LYRICS_ID`
8. **GET Lyrics** → Verify `synchronizedLyrics` is `[]`
9. **GET Song with no lyrics** → Verify 404 with "No lyrics found"

---

## 📊 Expected Performance

- All endpoints should respond in < 500ms
- N+1 query issues resolved (collaborators loaded in single query)
- Lyrics endpoints return consistent error format
- No breaking changes to existing API contracts

---

## 🐛 Troubleshooting

### Issue: "collaborators" field not appearing
**Solution:** Ensure you've added collaborators to the song via the `song_collaborators` join table.

### Issue: Getting null instead of empty string/array
**Solution:** Check lyrics service implementation - should use `|| ""` and `|| []`

### Issue: 500 error on song queries
**Solution:** Verify `CollaboratorsModule` is imported in `SongsModule`

### Issue: "Cannot read property 'map' of undefined"
**Solution:** Use optional chaining: `song.collaborators?.map()` with `|| []` fallback

---

**Last Updated:** January 23, 2025
**API Version:** v1
**Base URL:** http://localhost:3000

