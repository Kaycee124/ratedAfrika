# API Response Examples - Quick Reference

## 🎵 Lyrics Endpoints

### ❌ GET /lyrics/song/:songId - No Lyrics Found
```json
{
  "statusCode": 404,
  "message": "No lyrics found"
}
```

### ✅ GET /lyrics/song/:songId - Basic Lyrics Only
```json
{
  "statusCode": 200,
  "message": "Lyrics retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "songId": "550e8400-e29b-41d4-a716-446655440001",
    "basicLyrics": "Verse 1:\nThis is my song\nWith beautiful lyrics",
    "synchronizedLyrics": [],
    "version": 1,
    "isComplete": false,
    "createdBy": "user-uuid",
    "updatedBy": "user-uuid",
    "createdAt": "2025-01-23T10:30:00.000Z",
    "updatedAt": "2025-01-23T10:30:00.000Z"
  }
}
```

### ✅ GET /lyrics/song/:songId - Synchronized Lyrics Only
```json
{
  "statusCode": 200,
  "message": "Lyrics retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "songId": "550e8400-e29b-41d4-a716-446655440001",
    "basicLyrics": "",
    "synchronizedLyrics": [
      { "timestamp": 0, "text": "Verse 1:" },
      { "timestamp": 1000, "text": "This is my song" },
      { "timestamp": 3000, "text": "With beautiful lyrics" },
      { "timestamp": 6000, "text": "Chorus:" },
      { "timestamp": 7000, "text": "Singing all day long" }
    ],
    "version": 1,
    "isComplete": true,
    "createdBy": "user-uuid",
    "updatedBy": "user-uuid",
    "createdAt": "2025-01-23T10:30:00.000Z",
    "updatedAt": "2025-01-23T10:30:00.000Z"
  }
}
```

---

## 🎸 Songs with Collaborators

### ✅ GET /songs/:id - Song Details with Collaborators
```json
{
  "statusCode": 200,
  "message": "Song details retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "My Amazing Song",
    "releaseType": "SINGLE",
    "releaseLanguage": "English",
    "label": "Independent Records",
    "primaryGenre": "Pop",
    "secondaryGenres": ["R&B", "Soul"],
    "recordingYear": 2024,
    "isExplicit": false,
    "isrc": null,
    "description": "A beautiful song about love and life",
    "status": "DRAFT",
    "proposedReleaseDate": "2025-02-14T00:00:00.000Z",
    "releaseTime": "00:00",
    "isPreOrder": false,
    "trackPrice": 0.99,
    "targetStores": ["Spotify", "Apple Music", "YouTube Music"],
    "targetCountries": ["US", "UK", "CA"],
    
    "coverArtId": "cover-art-uuid",
    "masterTrackId": "master-track-uuid",
    "coverArtPath": "http://localhost:3000/storage/files/cover-art-uuid",
    "masterTrackPath": "http://localhost:3000/storage/files/master-track-uuid",
    
    "mixVersions": [],
    "previewClip": null,
    "musicVideo": null,
    
    "primaryArtist": {
      "id": "artist-uuid",
      "name": "Test Artist",
      "email": "artist@example.com",
      "country": "US",
      "phoneNumber": "+1234567890",
      "genres": ["Pop", "R&B"],
      "bio": "An amazing artist"
    },
    
    "featuredPlatformArtists": [],
    "featuredTempArtists": [],
    
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
      },
      {
        "name": "Mike Engineer",
        "email": "engineer@example.com",
        "role": "engineer"
      }
    ],
    
    "currentSplitSheetId": "splitsheet-uuid",
    "currentSplitSheet": {
      "id": "splitsheet-uuid",
      "status": "Active",
      "version": 1,
      "createdAt": "2025-01-23T10:00:00.000Z",
      "entries": [
        {
          "id": "entry-uuid-1",
          "recipientEmail": "producer@example.com",
          "recipientName": "John Producer",
          "percentage": 25.00,
          "status": "Active",
          "claimToken": "abc123...",
          "userId": null
        },
        {
          "id": "entry-uuid-2",
          "recipientEmail": "writer@example.com",
          "recipientName": "Jane Writer",
          "percentage": 20.00,
          "status": "Active",
          "claimToken": "def456...",
          "userId": null
        }
      ]
    },
    
    "releaseContainer": null,
    "trackNumber": null,
    "uploadedById": "user-uuid",
    "createdAt": "2025-01-23T09:00:00.000Z",
    "updatedAt": "2025-01-23T10:15:00.000Z",
    "deletedAt": null
  }
}
```

### ✅ GET /songs - Query Songs with Collaborators
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
        "status": "DRAFT",
        
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
        
        "currentSplitSheet": {
          "id": "splitsheet-uuid",
          "entries": [
            {
              "id": "entry-uuid",
              "recipientEmail": "producer@example.com",
              "recipientName": "John Producer",
              "percentage": 25.00,
              "status": "Active"
            }
          ]
        }
      },
      {
        "id": "song-uuid-2",
        "title": "Second Song",
        "primaryGenre": "Rock",
        "status": "PUBLISHED",
        
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

### ✅ GET /songs/userObject - User's Songs
```json
{
  "statusCode": 200,
  "message": "User songs retrieved successfully",
  "data": [
    {
      "id": "song-uuid",
      "title": "My Song",
      "releaseType": "SINGLE",
      "primaryGenre": "Pop",
      
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
      
      "coverArtPath": "http://localhost:3000/storage/files/cover-uuid",
      "masterTrackPath": "http://localhost:3000/storage/files/track-uuid",
      
      "primaryArtist": {
        "id": "artist-uuid",
        "name": "Test Artist"
      },
      
      "currentSplitSheetId": "splitsheet-uuid",
      "currentSplitSheet": {
        "id": "splitsheet-uuid",
        "entries": [
          {
            "recipientEmail": "producer@example.com",
            "percentage": 30.00
          },
          {
            "recipientEmail": "writer@example.com",
            "percentage": 25.00
          }
        ]
      }
    }
  ]
}
```

### ✅ GET /songs/artist/:artistId - Artist's Songs
```json
{
  "statusCode": 200,
  "message": "Artist songs retrieved successfully",
  "data": [
    {
      "id": "song-uuid",
      "title": "Artist Song 1",
      "primaryGenre": "Hip Hop",
      
      "collaborators": [
        {
          "name": "Beat Maker",
          "email": "beats@example.com",
          "role": "producer"
        }
      ],
      
      "primaryArtist": {
        "id": "artist-uuid",
        "name": "Test Artist"
      },
      
      "featuredPlatformArtists": [
        {
          "id": "featured-artist-uuid",
          "name": "Featured Artist"
        }
      ],
      
      "currentSplitSheet": {
        "id": "splitsheet-uuid",
        "status": "Active",
        "entries": [
          {
            "recipientEmail": "beats@example.com",
            "recipientName": "Beat Maker",
            "percentage": 40.00,
            "status": "Active"
          }
        ]
      }
    }
  ]
}
```

---

## 🔑 Key Changes Summary

### Lyrics Service
- ❌ **Before:** `{ statusCode: 404, message: "Lyrics not found for this song" }`
- ✅ **After:** `{ statusCode: 404, message: "No lyrics found" }`

- ❌ **Before:** Missing fields returned as `null`
- ✅ **After:** 
  - `basicLyrics`: Returns `""` (empty string) if missing
  - `synchronizedLyrics`: Returns `[]` (empty array) if missing

### Song Endpoints
- ✅ **Added:** `collaborators` array in all song responses
- ✅ **Format:** `{ name: string, email: string, role: string }`
- ✅ **Added:** `currentSplitSheet` with `entries` array
- ✅ **Consistency:** Both appear in all song query endpoints

---

## 📊 Field Comparison

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `basicLyrics` (missing) | `null` | `""` | Empty string |
| `synchronizedLyrics` (missing) | `null` | `[]` | Empty array |
| `collaborators` | ❌ Not present | ✅ Array | New field |
| `currentSplitSheet` | Only in details | ✅ All endpoints | Expanded |
| Error message | "Lyrics not found for this song" | "No lyrics found" | Simplified |

---

## 🧪 Test Assertions

### Lyrics Tests
```javascript
// No lyrics found
pm.expect(pm.response.code).to.equal(404);
pm.expect(response.message).to.equal("No lyrics found");

// Missing synchronized lyrics
pm.expect(response.data.synchronizedLyrics).to.be.an('array');
pm.expect(response.data.synchronizedLyrics).to.have.lengthOf(0);

// Missing basic lyrics
pm.expect(response.data.basicLyrics).to.be.a('string');
pm.expect(response.data.basicLyrics).to.equal('');
```

### Collaborators Tests
```javascript
// Collaborators array exists
pm.expect(response.data).to.have.property('collaborators');
pm.expect(response.data.collaborators).to.be.an('array');

// Collaborator structure
if (response.data.collaborators.length > 0) {
  const collab = response.data.collaborators[0];
  pm.expect(collab).to.have.all.keys('name', 'email', 'role');
}

// Split sheet exists
pm.expect(response.data).to.have.property('currentSplitSheet');
pm.expect(response.data).to.have.property('currentSplitSheetId');
```

---

**Documentation Version:** 1.0  
**Last Updated:** January 23, 2025

