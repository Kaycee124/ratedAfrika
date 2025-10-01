# RatedFans Link-in-Bio System - Project Documentation

## 🎯 Project Overview

**RatedFans** is a link-in-bio system for music releases that allows:
- Artists to create landing pages for their songs/albums
- End users get one link showing all streaming platforms
- Includes presave campaigns and promo card storage
- Uses existing local storage with S3 flexibility

## 📊 System Architecture

### Database Schema (5 Tables)
```sql
-- Main page data
ratedfans_pages: id, slug, title, description, artist_id, song_id, 
                is_published, is_presave_enabled, release_date, 
                custom_artwork_url, created_at, updated_at, deleted_at

-- Platform streaming links  
ratedfans_links: id, page_id, platform, url, is_active, is_primary, 
                display_order, created_at, updated_at

-- Presave campaign data
presave_signups: id, page_id, email, platform, status, 
                confirmation_token, confirmed_at, metadata, 
                created_at, updated_at

-- Frontend-generated promo storage
promo_cards: id, page_id, file_url, file_name, size, mime_type,
            metadata, created_at
```

### Streaming Platforms Enum
```typescript
enum StreamingPlatform {
  SPOTIFY = 'spotify',
  APPLE_MUSIC = 'apple_music', 
  YOUTUBE_MUSIC = 'youtube_music',
  DEEZER = 'deezer',
  SOUNDCLOUD = 'soundcloud',
  TIDAL = 'tidal',
  AMAZON_MUSIC = 'amazon_music',
}
```

## 🏗️ Implementation Status

### ✅ COMPLETED (100%)

#### 1. Database Entities
- `RatedFansPage` - Main page entity with Artist/Song relationships
- `RatedFansLink` - Platform links with validation and ordering
- `PresaveSignup` - Email signup with status tracking
- `PromoCard` - File storage with metadata
- **Location**: `src/ratedfans/entities/`

#### 2. DTOs (Data Transfer Objects)
- **Request DTOs**: `CreatePageDto`, `BulkUpdateLinksDto`, `PresaveSignupDto`, `PromoCardUploadDto`
- **Response DTOs**: `PublicPageResponseDto`, `DashboardPageResponseDto`, `PageLinkDto`
- **Query DTOs**: `PageListQueryDto`, `RedirectQueryDto`
- **Location**: `src/ratedfans/dtos/`

#### 3. Services Layer
- **RatedFansService**: Core CRUD operations, slug generation, ownership validation
- **LinkResolverService**: ISRC-based link discovery (placeholder for API calls)
- **PresaveService**: Email signup handling
- **Location**: `src/ratedfans/services/`

#### 4. Controllers
- **RatedFansPublicController**: Public endpoints (no auth required)
- **RatedFansDashboardController**: Artist dashboard (auth + subscription required)
- **Location**: `src/ratedfans/controllers/`

#### 5. Module Structure
- **RatedFansModule**: Complete NestJS module
- **Location**: `src/ratedfans/ratedfans.module.ts`

### 🚧 REMAINING TASKS

#### PHASE 1: Core Integration (IMMEDIATE)
1. **Add to app.module.ts** - Import RatedFansModule
2. **Database Migration** - Run migration for new tables
3. **Create ArtistSubscriptionGuard** - Gate features by subscription
4. **Test Integration** - Verify all systems work together

#### PHASE 2: Platform API Integration
1. **Spotify API** - Search tracks by ISRC (credentials available)
2. **YouTube Music API** - Google API integration
3. **Deezer API** - Free tier available
4. **Apple Music API** - If credentials available

#### PHASE 3: Testing & Enhancement
1. **End-to-end testing**
2. **Error handling improvements**
3. **Rate limiting for APIs**
4. **URL validation**

## 📋 API Endpoints

### Public Endpoints (No Auth)
```
GET  /r/{slug}              - Get page details + song info + artist socials
GET  /r/{slug}/links        - Get active streaming platform links  
GET  /r/{slug}/redirect     - Redirect with click tracking
POST /r/{slug}/presave      - Email signup for presave
```

### Artist Dashboard (Auth + Subscription Required)
```
POST /artist/ratedfans               - Create new page for song
GET  /artist/ratedfans               - List my pages
PUT  /artist/ratedfans/{id}/links    - Manually add/edit platform links
POST /artist/ratedfans/{id}/get-links-by-isrc - Get links by ISRC feature
POST /artist/ratedfans/{id}/publish  - Publish/unpublish page  
GET  /artist/ratedfans/{id}/presave-stats - View presave analytics
POST /artist/ratedfans/{id}/promos   - Save promo card from frontend
GET  /artist/ratedfans/{id}/promos   - List saved promos
```

## 🔌 Integration Points

### Existing Systems Used
- **Auth Module**: JWT authentication + artist validation
- **Artist Entity**: Social links and subscription validation  
- **Song Entity**: Metadata (title, artwork, ISRC)
- **Storage Module**: Promo card uploads (local provider)
- **Logger**: Event tracking
- **Guards**: `JwtAuthGuard`, `SubscriptionGuard` (ARTIST plan required)

### New Components Needed
- **ArtistSubscriptionGuard**: Validates active ARTIST subscription
- **Platform API Services**: Spotify, YouTube, Deezer integrations

## 🛠️ Key Implementation Details

### Slug Generation
```typescript
// SEO-friendly URLs: /r/artist-song-title
generateSlug(artistName: string, songTitle: string): string
ensureUniqueSlug(baseSlug: string): Promise<string>
```

### Link Management Flow
1. **Manual Entry**: Artist directly adds platform + URL pairs
2. **ISRC Discovery**: System searches platforms using song's ISRC code
3. **Bulk Operations**: Replace all links or update specific platforms
4. **Validation**: No duplicate platforms, proper URL format

### Promo Card Handling
1. **Frontend**: Generates image (canvas to PNG/JPG base64)
2. **Backend**: Decodes base64, validates, stores via StorageService
3. **Metadata**: Stores design info, dimensions, file details

### ISRC Error Handling
- **Missing ISRC**: Returns clear error message to update song record
- **API Failures**: Graceful fallback to manual entry
- **Rate Limits**: Proper error handling for external APIs

## 🔧 Technical Configuration

### Environment Variables Needed
```bash
# Spotify API (Already Available)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# YouTube API (Google Cloud)
YOUTUBE_API_KEY=your_youtube_api_key

# Deezer API (Free Tier)
DEEZER_APP_ID=your_deezer_app_id
DEEZER_SECRET_KEY=your_deezer_secret

# Apple Music API (If Available)
APPLE_MUSIC_TEAM_ID=your_team_id
APPLE_MUSIC_KEY_ID=your_key_id
APPLE_MUSIC_PRIVATE_KEY=your_private_key_path
```

### Platform API Setup Instructions

#### Spotify Web API
```typescript
// Already have credentials - just need to implement search
// Uses existing SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
async searchSpotifyByISRC(isrc: string): Promise<string | null> {
  // Get access token using client credentials
  // Search: GET https://api.spotify.com/v1/search?q=isrc:{isrc}&type=track
  // Return external_urls.spotify from first result
}
```

#### YouTube Music API
```typescript
// Requires Google Cloud API Key
// Search YouTube for track by ISRC or artist+title
async searchYouTubeByISRC(isrc: string, artist: string, title: string): Promise<string | null> {
  // Fallback to artist+title search if ISRC fails
  // Use YouTube Data API v3: search endpoint
  // Return music.youtube.com URL
}
```

#### Deezer API  
```typescript
// Free tier available - no auth required for search
async searchDeezerByISRC(isrc: string): Promise<string | null> {
  // GET https://api.deezer.com/search?q=isrc:{isrc}
  // Return link from first result
}
```

## 📁 File Structure
```
src/ratedfans/
├── entities/
│   ├── ratedfans-page.entity.ts     ✅
│   ├── ratedfans-link.entity.ts     ✅  
│   ├── presave-signup.entity.ts     ✅
│   ├── promo-card.entity.ts         ✅
│   └── index.ts                     ✅
├── dtos/
│   ├── create-page.dto.ts           ✅
│   ├── update-page.dto.ts           ✅
│   ├── link-management.dto.ts       ✅
│   ├── presave.dto.ts               ✅
│   ├── page-response.dto.ts         ✅
│   ├── promo-card.dto.ts            ✅
│   ├── query-params.dto.ts          ✅
│   └── index.ts                     ✅
├── services/
│   ├── ratedfans.service.ts         ✅
│   ├── link-resolver.service.ts     ✅ (needs API implementation)
│   ├── presave.service.ts           ✅
│   └── index.ts                     ✅
├── controllers/
│   ├── ratedfans-public.controller.ts     ✅
│   ├── ratedfans-dashboard.controller.ts  ✅
│   └── index.ts                           ✅
├── guards/
│   └── artist-subscription.guard.ts       🚧 (to be created)
└── ratedfans.module.ts                    ✅
```

## 🚀 Next Steps for New Chat

1. **Immediate Integration**:
   ```bash
   # Add RatedFansModule to app.module.ts
   # Run database migration
   npm run migration:generate -- CreateRatedFansSystem
   npm run migration:run
   ```

2. **Create Artist Subscription Guard**:
   ```typescript
   // Validate user has ARTIST subscription plan
   // Gate all dashboard endpoints
   ```

3. **Implement Platform APIs**:
   ```typescript
   // Start with Spotify (credentials available)
   // Add YouTube Music API integration  
   // Add Deezer API integration
   ```

4. **Testing**:
   ```bash
   # Test page creation flow
   # Test link management
   # Test public access via /r/{slug}
   # Test promo card uploads
   ```

## 💡 Important Notes

- **ISRC Handling**: Song entity has optional ISRC field - proper error handling implemented
- **Storage Integration**: Uses existing StorageService with local provider
- **Authentication**: Leverages existing JWT + Artist auth system
- **Subscription Gating**: Features require active ARTIST subscription plan
- **URL Structure**: Public pages accessible via `/r/{slug}` format
- **Promo Cards**: Frontend generates, backend stores via base64 upload

## 🔗 External Dependencies

- **TypeORM**: Database ORM with PostgreSQL
- **NestJS**: Framework with modules, guards, services  
- **JWT**: Authentication via existing auth module
- **Storage**: Local file storage (S3 ready)
- **Platform APIs**: Spotify, YouTube, Deezer for link discovery

---

**Status**: Core system 100% implemented, ready for integration and platform API implementation.
