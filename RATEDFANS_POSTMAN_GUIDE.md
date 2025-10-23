# RatedFans API - Postman Testing Guide

## 📋 Base Configuration

- **Base URL**: `http://localhost:3000` (or your deployed URL)
- **Authentication**: Bearer Token (JWT) required for Dashboard endpoints
- **Content-Type**: `application/json`

---

## 🔐 Authentication Setup

### Get Your JWT Token First
Before testing RatedFans endpoints, you need to authenticate:

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "artist@example.com",
  "password": "your-password"
}
```

**Expected Response (200 OK)**:
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "artist@example.com",
      "subscription": "ARTIST"
    }
  }
}
```

**For Protected Endpoints**: 
- Go to Authorization tab → Type: Bearer Token
- Paste the `access_token` value

---

## 🎵 RatedFans Endpoints

### 1. CREATE NEW RATEDFANS PAGE (Dashboard)

**Endpoint**: `POST /artist/ratedfans`  
**Auth**: Required (Bearer Token)  
**Subscription**: ARTIST plan required

#### Request Body - Distributed Song (with songId):
```json
{
  "releaseTitle": "Last Last",
  "artistName": "Burna Boy",
  "songId": "550e8400-e29b-41d4-a716-446655440000",
  "customSlug": "burna-boy-last-last",
  "isPresaveEnabled": true,
  "releaseDate": "2025-02-14T00:00:00.000Z",
  "releaseType": "Single",
  "socialMediaLinks": {
    "instagram": "https://instagram.com/burnaboy",
    "tiktok": "https://tiktok.com/@burnaboy",
    "x": "https://x.com/burnaboy"
  },
  "artistSocialMediaLinks": {
    "instagram": "https://instagram.com/burnaboy",
    "youtube": "https://youtube.com/@burnaboy"
  },
  "previewClips": [
    {
      "title": "Main Preview",
      "url": "https://storage.example.com/preview1.mp3"
    }
  ],
  "coverArtLink": {
    "url": "https://storage.example.com/cover.jpg"
  }
}
```

#### Request Body - Platform Song (without songId):
```json
{
  "releaseTitle": "New Single",
  "artistName": "Wizkid",
  "customSlug": "wizkid-new-single",
  "isPresaveEnabled": false,
  "releaseDate": "2025-03-01T00:00:00.000Z",
  "releaseType": "Single",
  "socialMediaLinks": {
    "instagram": "https://instagram.com/wizkid"
  },
  "previewClips": [
    {
      "title": "Snippet 1",
      "url": "https://storage.example.com/snippet1.mp3"
    },
    {
      "title": "Snippet 2",
      "url": "https://storage.example.com/snippet2.mp3"
    }
  ],
  "coverArtLink": {
    "url": "https://storage.example.com/artwork.jpg"
  }
}
```

#### Expected Response (201 CREATED):
```json
{
  "statusCode": 201,
  "message": "RatedFans page created successfully",
  "data": {
    "id": "page-uuid",
    "slug": "burna-boy-last-last",
    "pageUrl": "http://localhost:3000/r/burna-boy-last-last",
    "releaseTitle": "Last Last",
    "artistName": "Burna Boy",
    "isPublished": false,
    "isPresaveEnabled": true,
    "releaseDate": "2025-02-14T00:00:00.000Z",
    "releaseType": "Single",
    "socialMediaLinks": {
      "instagram": "https://instagram.com/burnaboy",
      "tiktok": "https://tiktok.com/@burnaboy",
      "x": "https://x.com/burnaboy"
    },
    "previewClips": [
      {
        "title": "Main Preview",
        "url": "https://storage.example.com/preview1.mp3"
      }
    ],
    "coverArtLink": {
      "url": "https://storage.example.com/cover.jpg"
    },
    "createdAt": "2025-01-23T00:00:00.000Z",
    "updatedAt": "2025-01-23T00:00:00.000Z",
    "artist": {
      "id": "artist-uuid",
      "name": "Burna Boy",
      "musicPlatforms": {},
      "socialMediaLinks": {}
    },
    "song": {
      "id": "song-uuid",
      "title": "Last Last",
      "releaseLanguage": "English",
      "primaryGenre": "Afrobeats",
      "secondaryGenres": ["Pop"],
      "isExplicit": false,
      "description": null,
      "coverArtPath": "/storage/covers/...",
      "previewClipPath": "/storage/previews/..."
    },
    "links": []
  }
}
```

#### Error Response - Duplicate Slug (409 CONFLICT):
```json
{
  "statusCode": 409,
  "message": "Slug \"burna-boy-last-last\" is already taken. Please choose a different custom slug."
}
```

#### Error Response - Missing Artist Name (400 BAD REQUEST):
```json
{
  "statusCode": 400,
  "message": "Artist name is required"
}
```

#### Error Response - Song Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Song not found"
}
```

#### Error Response - Unauthorized Song (403 FORBIDDEN):
```json
{
  "statusCode": 403,
  "message": "You do not have permission to create a page for this song"
}
```

#### Error Response - Page Already Exists (409 CONFLICT):
```json
{
  "statusCode": 409,
  "message": "A RatedFans page already exists for this song"
}
```

---

### 2. LIST MY PAGES (Dashboard)

**Endpoint**: `GET /artist/ratedfans`  
**Auth**: Required (Bearer Token)

#### Query Parameters (Optional):
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `isPublished`: Filter by publication status (true/false)
- `search`: Search by release title or artist name

#### Example Request:
```
GET /artist/ratedfans?page=1&limit=10&isPublished=true
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Pages retrieved successfully",
  "data": {
    "pages": [
      {
        "id": "page-uuid-1",
        "slug": "burna-boy-last-last",
        "pageUrl": "http://localhost:3000/r/burna-boy-last-last",
        "releaseTitle": "Last Last",
        "isPublished": true,
        "isPresaveEnabled": true,
        "createdAt": "2025-01-23T00:00:00.000Z",
        "updatedAt": "2025-01-23T00:00:00.000Z",
        "songTitle": "Last Last",
        "artistName": "Burna Boy",
        "totalLinks": 5,
        "totalPresaves": 234
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 28,
      "itemsPerPage": 10
    }
  }
}
```

---

### 3. UPDATE PAGE (Dashboard)

**Endpoint**: `PATCH /artist/ratedfans/:pageId`  
**Auth**: Required (Bearer Token)

#### Request Body (All fields optional):
```json
{
  "releaseTitle": "Last Last (Remix)",
  "customSlug": "burna-boy-last-last-remix",
  "isPresaveEnabled": false,
  "releaseDate": "2025-03-01T00:00:00.000Z",
  "socialMediaLinks": {
    "instagram": "https://instagram.com/burnaboy",
    "youtube": "https://youtube.com/@burnaboy"
  },
  "previewClips": [
    {
      "title": "Updated Preview",
      "url": "https://storage.example.com/new-preview.mp3"
    }
  ]
}
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Page updated successfully",
  "data": {
    "id": "page-uuid",
    "slug": "burna-boy-last-last-remix",
    "releaseTitle": "Last Last (Remix)",
    "artistName": "Burna Boy",
    "isPublished": true,
    "isPresaveEnabled": false,
    "releaseDate": "2025-03-01T00:00:00.000Z",
    "updatedAt": "2025-01-23T01:00:00.000Z"
  }
}
```

#### Error Response - Duplicate Slug (409 CONFLICT):
```json
{
  "statusCode": 409,
  "message": "Slug \"burna-boy-last-last-remix\" is already taken. Please choose a different slug."
}
```

#### Error Response - Page Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Page not found"
}
```

#### Error Response - Unauthorized (403 FORBIDDEN):
```json
{
  "statusCode": 403,
  "message": "You do not have permission to update this page"
}
```

---

### 4. DELETE PAGE (Dashboard)

**Endpoint**: `DELETE /artist/ratedfans/:pageId`  
**Auth**: Required (Bearer Token)

#### Example Request:
```
DELETE /artist/ratedfans/550e8400-e29b-41d4-a716-446655440000
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Page deleted successfully"
}
```

#### Error Response - Page Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Page not found"
}
```

#### Error Response - Unauthorized (403 FORBIDDEN):
```json
{
  "statusCode": 403,
  "message": "You do not have permission to delete this page"
}
```

---

### 5. UPDATE PAGE LINKS (Dashboard)

**Endpoint**: `PUT /artist/ratedfans/:pageId/links`  
**Auth**: Required (Bearer Token)

#### Request Body:
```json
{
  "links": [
    {
      "platform": "spotify",
      "url": "https://open.spotify.com/track/xxxxx"
    },
    {
      "platform": "apple_music",
      "url": "https://music.apple.com/album/xxxxx"
    },
    {
      "platform": "youtube_music",
      "url": "https://music.youtube.com/watch?v=xxxxx"
    },
    {
      "platform": "audiomack",
      "url": "https://audiomack.com/song/xxxxx"
    },
    {
      "platform": "tidal",
      "url": "https://tidal.com/browse/track/xxxxx"
    }
  ],
  "replaceExisting": true
}
```

**Note**: The following fields are **NOT** needed in the request (auto-managed by backend):
- ~~`isPrimary`~~ - First link is automatically set as primary
- ~~`displayOrder`~~ - Automatically ordered by array index

#### Available Platforms:
- `spotify`
- `apple_music`
- `youtube_music`
- `amazon_music`
- `deezer`
- `tidal`
- `audiomack`
- `soundcloud`
- `boomplay`

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Links updated successfully",
  "data": {
    "links": [
      {
        "id": "link-uuid-1",
        "platform": "spotify",
        "url": "https://open.spotify.com/track/xxxxx",
        "isPrimary": true,
        "displayOrder": 0
      },
      {
        "id": "link-uuid-2",
        "platform": "apple_music",
        "url": "https://music.apple.com/album/xxxxx",
        "isPrimary": false,
        "displayOrder": 1
      }
    ]
  }
}
```

#### Error Response - Invalid URL (400 BAD REQUEST):
```json
{
  "statusCode": 400,
  "message": "Please provide a valid URL",
  "errors": ["url must be a URL address"]
}
```

---

### 6. AUTO-DISCOVER LINKS BY ISRC (Dashboard)

**Endpoint**: `POST /artist/ratedfans/:pageId/get-links-by-isrc`  
**Auth**: Required (Bearer Token)

#### Example Request:
```
POST /artist/ratedfans/550e8400-e29b-41d4-a716-446655440000/get-links-by-isrc
```

#### Expected Response (200 OK):
```json
[
  {
    "platform": "spotify",
    "url": "https://open.spotify.com/track/xxxxx",
    "found": true,
    "confidence": "high"
  },
  {
    "platform": "apple_music",
    "url": "https://music.apple.com/album/xxxxx",
    "found": true,
    "confidence": "high"
  },
  {
    "platform": "deezer",
    "url": null,
    "found": false,
    "error": "Track not found on this platform"
  }
]
```

---

### 7. PUBLISH/UNPUBLISH PAGE (Dashboard)

**Endpoint**: `POST /artist/ratedfans/:pageId/publish`  
**Auth**: Required (Bearer Token)

#### Request Body - Publish:
```json
{
  "isPublished": true
}
```

#### Request Body - Unpublish:
```json
{
  "isPublished": false
}
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Page published successfully",
  "data": {
    "id": "page-uuid",
    "slug": "burna-boy-last-last",
    "isPublished": true,
    "updatedAt": "2025-01-23T02:00:00.000Z"
  }
}
```

#### Error Response - Page Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Page not found"
}
```

---

### 8. GET PAGE BY SLUG (Public - No Auth)

**Endpoint**: `GET /r/:slug`  
**Auth**: Not Required

#### Example Request:
```
GET /r/burna-boy-last-last
```

#### Expected Response - Published Page (200 OK):
```json
{
  "statusCode": 200,
  "message": "Page retrieved successfully",
  "data": {
    "id": "page-uuid",
    "slug": "burna-boy-last-last",
    "pageUrl": "http://localhost:3000/r/burna-boy-last-last",
    "releaseTitle": "Last Last",
    "artistName": "Burna Boy",
    "isPublished": true,
    "isPresaveEnabled": true,
    "releaseDate": "2025-02-14T00:00:00.000Z",
    "releaseType": "Single",
    "socialMediaLinks": {
      "instagram": "https://instagram.com/burnaboy",
      "tiktok": "https://tiktok.com/@burnaboy"
    },
    "previewClips": [
      {
        "title": "Main Preview",
        "url": "https://storage.example.com/preview1.mp3"
      }
    ],
    "coverArtLink": {
      "url": "https://storage.example.com/cover.jpg"
    },
    "createdAt": "2025-01-23T00:00:00.000Z",
    "artist": {
      "id": "artist-uuid",
      "name": "Burna Boy",
      "musicPlatforms": {
        "spotify": "https://open.spotify.com/artist/xxxxx",
        "appleMusic": "https://music.apple.com/artist/xxxxx"
      },
      "socialMediaLinks": {
        "instagram": "https://instagram.com/burnaboy",
        "x": "https://x.com/burnaboy"
      }
    },
    "song": {
      "id": "song-uuid",
      "title": "Last Last",
      "releaseLanguage": "English",
      "primaryGenre": "Afrobeats",
      "secondaryGenres": ["Pop"],
      "isExplicit": false,
      "coverArtPath": "/storage/covers/...",
      "releaseDate": "2025-02-14T00:00:00.000Z"
    },
    "links": [
      {
        "id": "link-uuid-1",
        "platform": "spotify",
        "url": "https://open.spotify.com/track/xxxxx",
        "isPrimary": true,
        "displayOrder": 0
      },
      {
        "id": "link-uuid-2",
        "platform": "apple_music",
        "url": "https://music.apple.com/album/xxxxx",
        "isPrimary": false,
        "displayOrder": 1
      }
    ]
  }
}
```

#### Error Response - Page Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Page not found"
}
```

#### Error Response - Page Not Published (403 FORBIDDEN):
```json
{
  "statusCode": 403,
  "message": "This page is not published yet"
}
```

---

### 9. GET PAGE LINKS (Public - No Auth)

**Endpoint**: `GET /r/:slug/links`  
**Auth**: Not Required

#### Example Request:
```
GET /r/burna-boy-last-last/links
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Links retrieved successfully",
  "data": {
    "links": [
      {
        "id": "link-uuid-1",
        "platform": "spotify",
        "url": "https://open.spotify.com/track/xxxxx",
        "isPrimary": true,
        "displayOrder": 0
      },
      {
        "id": "link-uuid-2",
        "platform": "apple_music",
        "url": "https://music.apple.com/album/xxxxx",
        "isPrimary": false,
        "displayOrder": 1
      },
      {
        "id": "link-uuid-3",
        "platform": "youtube_music",
        "url": "https://music.youtube.com/watch?v=xxxxx",
        "isPrimary": false,
        "displayOrder": 2
      }
    ]
  }
}
```

#### Error Response - Page Not Found (404 NOT FOUND):
```json
{
  "statusCode": 404,
  "message": "Page not found"
}
```

---

### 10. REDIRECT TO PLATFORM (Public - No Auth)

**Endpoint**: `GET /r/:slug/redirect`  
**Auth**: Not Required

#### Query Parameters:
- `platform`: Streaming platform name (required)

#### Example Request:
```
GET /r/burna-boy-last-last/redirect?platform=spotify
```

#### Expected Response:
- **302 Redirect** to the platform URL
- **404 NOT FOUND** if page doesn't exist
- **404 NOT FOUND** if platform link doesn't exist

---

### 11. PRESAVE SIGNUP (Public - No Auth)

**Endpoint**: `POST /r/:slug/presave`  
**Auth**: Not Required

#### Request Body:
```json
{
  "email": "fan@example.com",
  "platform": "spotify",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "referer": "https://instagram.com",
    "source": "instagram_story",
    "utmSource": "instagram",
    "utmMedium": "social",
    "utmCampaign": "last_last_presave"
  }
}
```

#### Expected Response (201 CREATED):
```json
{
  "statusCode": 201,
  "message": "Presave signup successful! Please check your email to confirm.",
  "data": {
    "id": "presave-uuid",
    "email": "fan@example.com",
    "platform": "spotify",
    "status": "pending",
    "createdAt": "2025-01-23T03:00:00.000Z"
  }
}
```

#### Error Response - Already Signed Up (409 CONFLICT):
```json
{
  "statusCode": 409,
  "message": "You have already signed up for presave on this platform"
}
```

#### Error Response - Invalid Email (400 BAD REQUEST):
```json
{
  "statusCode": 400,
  "message": "Please provide a valid email address"
}
```

---

### 12. GET PRESAVE STATS (Dashboard)

**Endpoint**: `GET /artist/ratedfans/:pageId/presave-stats`  
**Auth**: Required (Bearer Token)

#### Example Request:
```
GET /artist/ratedfans/550e8400-e29b-41d4-a716-446655440000/presave-stats
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Presave stats retrieved successfully",
  "data": {
    "totalSignups": 547,
    "totalConfirmed": 432,
    "totalPending": 115,
    "byPlatform": [
      {
        "platform": "spotify",
        "status": "confirmed",
        "count": 234
      },
      {
        "platform": "spotify",
        "status": "pending",
        "count": 67
      },
      {
        "platform": "apple_music",
        "status": "confirmed",
        "count": 198
      },
      {
        "platform": "apple_music",
        "status": "pending",
        "count": 48
      }
    ]
  }
}
```

---

### 13. SAVE PROMO CARD (Dashboard)

**Endpoint**: `POST /artist/ratedfans/:pageId/promos`  
**Auth**: Required (Bearer Token)

#### Request Body:
```json
{
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "fileName": "promo-card.png",
  "description": "Instagram story promo",
  "designMetadata": {
    "template": "modern-gradient",
    "colors": ["#FF6B6B", "#4ECDC4"],
    "dimensions": {
      "width": 1080,
      "height": 1920
    }
  }
}
```

#### Expected Response (201 CREATED):
```json
{
  "statusCode": 201,
  "message": "Promo card saved successfully",
  "data": {
    "id": "promo-uuid",
    "pageId": "page-uuid",
    "fileName": "promo-card.png",
    "fileUrl": "promo-cards/page-uuid/1737593400000-abc123-promo-card.png",
    "size": 245678,
    "mimeType": "image/png",
    "metadata": {
      "width": 1080,
      "height": 1920,
      "format": "png",
      "originalName": "promo-card.png",
      "description": "Instagram story promo"
    },
    "createdAt": "2025-01-23T04:00:00.000Z"
  }
}
```

#### Error Response - Invalid Image (400 BAD REQUEST):
```json
{
  "statusCode": 400,
  "message": "Invalid base64 image data format"
}
```

#### Error Response - File Too Large (400 BAD REQUEST):
```json
{
  "statusCode": 400,
  "message": "Image file too large (max 5MB)"
}
```

---

### 14. GET PROMO CARDS (Dashboard)

**Endpoint**: `GET /artist/ratedfans/:pageId/promos`  
**Auth**: Required (Bearer Token)

#### Example Request:
```
GET /artist/ratedfans/550e8400-e29b-41d4-a716-446655440000/promos
```

#### Expected Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "Promo cards retrieved successfully",
  "data": {
    "promoCards": [
      {
        "id": "promo-uuid-1",
        "pageId": "page-uuid",
        "fileName": "promo-card.png",
        "fileUrl": "promo-cards/page-uuid/1737593400000-abc123-promo-card.png",
        "size": 245678,
        "mimeType": "image/png",
        "metadata": {
          "width": 1080,
          "height": 1920,
          "format": "png",
          "description": "Instagram story promo"
        },
        "createdAt": "2025-01-23T04:00:00.000Z"
      }
    ]
  }
}
```

---

## 🧪 Testing Scenarios for Recent Changes

### **Scenario 1: Test Duplicate Slug Rejection (NEW)**

1. **Create First Page**:
   ```
   POST /artist/ratedfans
   Body: { "releaseTitle": "Test Song", "artistName": "Test Artist", "customSlug": "test-slug" }
   Expected: 201 CREATED
   ```

2. **Try to Create Duplicate**:
   ```
   POST /artist/ratedfans
   Body: { "releaseTitle": "Another Song", "artistName": "Test Artist", "customSlug": "test-slug" }
   Expected: 409 CONFLICT
   Response: { "statusCode": 409, "message": "Slug \"test-slug\" is already taken. Please choose a different custom slug." }
   ```

3. **Update to Existing Slug**:
   ```
   PATCH /artist/ratedfans/{pageId}
   Body: { "customSlug": "test-slug" }
   Expected: 409 CONFLICT
   Response: { "statusCode": 409, "message": "Slug \"test-slug\" is already taken. Please choose a different slug." }
   ```

### **Scenario 2: Test Auto-Generated Slugs**

1. **Create Without Custom Slug**:
   ```
   POST /artist/ratedfans
   Body: { "releaseTitle": "Amazing Song", "artistName": "Burna Boy", "songId": "valid-song-uuid" }
   Expected: 201 CREATED with auto-generated slug like "burna-boy-amazing-song"
   ```

2. **Try to Create Duplicate Auto-Generated**:
   ```
   POST /artist/ratedfans
   Body: { "releaseTitle": "Amazing Song", "artistName": "Burna Boy", "songId": "another-valid-song-uuid" }
   Expected: 409 CONFLICT (no auto-increment, just rejection)
   ```

### **Scenario 3: Test Public Slug Endpoint**

1. **Access Published Page**:
   ```
   GET /r/burna-boy-last-last
   Expected: 200 OK with full page data
   ```

2. **Access Unpublished Page**:
   ```
   GET /r/unpublished-slug
   Expected: 403 FORBIDDEN
   Response: { "statusCode": 403, "message": "This page is not published yet" }
   ```

3. **Access Non-Existent Slug**:
   ```
   GET /r/does-not-exist
   Expected: 404 NOT FOUND
   Response: { "statusCode": 404, "message": "Page not found" }
   ```

### **Scenario 4: Test Link Management (No isPrimary/displayOrder)**

1. **Add Links (Correct Format)**:
   ```json
   PUT /artist/ratedfans/{pageId}/links
   Body: {
     "links": [
       { "platform": "spotify", "url": "https://open.spotify.com/track/xxxxx" },
       { "platform": "apple_music", "url": "https://music.apple.com/album/xxxxx" }
     ]
   }
   Expected: 200 OK
   Note: First link auto-set as primary, displayOrder auto-assigned
   ```

2. **Try Old Format (Should Still Work)**:
   ```json
   PUT /artist/ratedfans/{pageId}/links
   Body: {
     "links": [
       { "platform": "spotify", "url": "https://...", "isPrimary": true, "displayOrder": 1 }
     ]
   }
   Expected: Backend ignores isPrimary/displayOrder, uses auto-management
   ```

---

## 📦 Postman Collection Structure

Suggested folder organization:

```
RatedFans API/
├── 🔐 Authentication/
│   └── Login
├── 📊 Dashboard (Protected)/
│   ├── Create Page
│   ├── List My Pages
│   ├── Update Page
│   ├── Delete Page
│   ├── Update Links
│   ├── Auto-Discover Links
│   ├── Publish Page
│   ├── Get Presave Stats
│   ├── Save Promo Card
│   └── Get Promo Cards
└── 🌐 Public Access/
    ├── Get Page by Slug
    ├── Get Page Links
    ├── Redirect to Platform
    └── Presave Signup
```

---

## 🔍 Quick Debugging Tips

### Check if JWT is Valid:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/artist/ratedfans
```

### Check Server Logs:
Look for these log messages:
- `Creating RatedFans page...`
- `Retrieving page by slug (direct access)...`
- `Updating RatedFans page...`

### Common Error Status Codes:
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing/invalid JWT)
- `403` - Forbidden (insufficient permissions or unpublished page)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate slug)
- `500` - Internal Server Error (check logs)

---

## ✅ Testing Checklist

- [ ] Can create page with custom slug
- [ ] Can create page with auto-generated slug
- [ ] Duplicate slugs are rejected with 409
- [ ] Can update page slug (if unique)
- [ ] Duplicate slug updates are rejected
- [ ] Public can access published pages via /r/:slug
- [ ] Public cannot access unpublished pages (403)
- [ ] Non-existent slugs return 404
- [ ] Links can be added without isPrimary/displayOrder
- [ ] First link is automatically set as primary
- [ ] Presave signups work correctly
- [ ] Promo cards can be uploaded and retrieved

---

**Last Updated**: January 23, 2025  
**API Version**: v1  
**Changes**: Removed auto-incrementing slugs, added duplicate rejection, simplified public endpoint

