# Split Sheet API - Postman Documentation

## Base URL
```
{{baseUrl}}/split-sheets
```

## Authentication
All endpoints require JWT Bearer token authentication (except verify claim token).

**Headers:**
```json
{
  "Authorization": "Bearer {{accessToken}}",
  "Content-Type": "application/json"
}
```

---

## 1. Create Split Sheet

**POST** `/split-sheets`

Creates a new split sheet for a song. Only the song owner or primary artist can create split sheets.

### Headers
```json
{
  "Authorization": "Bearer {{accessToken}}",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "songId": "550e8400-e29b-41d4-a716-446655440000",
  "entries": [
    {
      "recipientEmail": "artist1@example.com",
      "recipientName": "Artist One",
      "percentage": 40.0
    },
    {
      "recipientEmail": "producer@example.com", 
      "recipientName": "Producer",
      "percentage": 30.0
    },
    {
      "recipientEmail": "songwriter@example.com",
      "recipientName": "Songwriter", 
      "percentage": 15.0
    }
  ]
}
```

### Response (201 Created)
```json
{
  "statusCode": 201,
  "message": "Split sheet created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Active",
    "version": 1,
    "lastModifiedBy": "user-id",
    "createdAt": "2025-01-28T10:30:00.000Z",
    "entries": [
      {
        "id": "entry-id-1",
        "recipientEmail": "artist1@example.com",
        "recipientName": "Artist One",
        "percentage": 40.0,
        "status": "PENDING",
        "claimToken": "claim-token-1"
      }
    ],
    "song": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Song Title"
    }
  }
}
```

### Error Responses
```json
// 400 - Split sheet already exists
{
  "statusCode": 400,
  "message": "A split sheet already exists for this song. Please update the existing split sheet."
}

// 403 - Unauthorized
{
  "statusCode": 403,
  "message": "You are not authorized to create a split sheet for this song. Only the song owner or primary artist can create split sheets."
}

// 400 - Invalid percentages
{
  "statusCode": 400,
  "message": "Invalid entries: Total percentage exceeds allowed limit of 85%"
}
```

---

## 2. Get Split Sheet by ID

**GET** `/split-sheets/:id`

Retrieves a specific split sheet by its ID.

### URL Parameters
- `id` (uuid, required): Split sheet ID

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Split sheet retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Active",
    "version": 1,
    "createdAt": "2025-01-28T10:30:00.000Z",
    "entries": [...],
    "song": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Song Title",
      "uploadedBy": {
        "id": "user-id",
        "name": "User Name"
      }
    }
  }
}
```

---

## 3. Update Split Sheet (NEW VERSIONING STRATEGY)

**PUT** `/split-sheets/:id`

Updates an existing split sheet using the versioning strategy (creates a new version).

### URL Parameters
- `id` (uuid, required): Split sheet ID to update

### Request Body
```json
{
  "entries": [
    {
      "recipientEmail": "artist1@example.com",
      "recipientName": "Artist One",
      "percentage": 45.0
    },
    {
      "recipientEmail": "newartist@example.com",
      "recipientName": "New Artist",
      "percentage": 25.0
    },
    {
      "recipientEmail": "producer@example.com",
      "recipientName": "Producer",
      "percentage": 15.0
    }
  ]
}
```

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Split sheet updated successfully",
  "data": {
    "id": "new-version-id",
    "status": "Active",
    "version": 2,
    "previousVersionId": "123e4567-e89b-12d3-a456-426614174000",
    "lastModifiedBy": "user-id",
    "createdAt": "2025-01-28T11:00:00.000Z",
    "entries": [...],
    "song": {...}
  }
}
```

### Error Responses
```json
// 400 - Cannot modify paid out split sheet
{
  "statusCode": 400,
  "message": "Cannot modify a paid out split sheet"
}

// 400 - Cannot modify with paid entries
{
  "statusCode": 400,
  "message": "Cannot modify split sheet with paid out entries"
}
```

---

## 4. Get User Splits

**GET** `/split-sheets`

Retrieves split entries for the authenticated user or by query parameters.

### Query Parameters
- `userId` (uuid, optional): Get splits for specific user
- `email` (string, optional): Get splits by email address

### Examples
```
GET /split-sheets
GET /split-sheets?userId=user-id
GET /split-sheets?email=user@example.com
```

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "User splits retrieved successfully",
  "data": [
    {
      "id": "entry-id",
      "recipientEmail": "user@example.com",
      "recipientName": "User Name",
      "percentage": 40.0,
      "status": "ACTIVE",
      "claimToken": "claim-token",
      "splitSheet": {
        "id": "splitsheet-id",
        "song": {
          "id": "song-id",
          "title": "Song Title"
        }
      }
    }
  ]
}
```

---

## 5. Get Split Sheet Entries

**GET** `/split-sheets/:id/entries`

Retrieves all entries for a specific split sheet.

### URL Parameters
- `id` (uuid, required): Split sheet ID

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Split sheet entries retrieved successfully",
  "data": [
    {
      "id": "entry-id-1",
      "recipientEmail": "artist@example.com",
      "recipientName": "Artist",
      "percentage": 40.0,
      "status": "ACTIVE",
      "userId": "user-id",
      "claimToken": "claim-token"
    },
    {
      "id": "entry-id-2",
      "recipientEmail": "Platform Service Fee",
      "percentage": 15.0,
      "status": "ACTIVE"
    }
  ]
}
```

---

## 6. Get Split Sheet by Song ID

**GET** `/split-sheets/song/:songId`

Retrieves the current active split sheet for a specific song.

### URL Parameters
- `songId` (uuid, required): Song ID

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Split sheet retrieved successfully",
  "data": {
    "splitSheetId": "current-splitsheet-id",
    "splitSheet": {
      "id": "current-splitsheet-id",
      "status": "Active",
      "version": 2,
      "entries": [...],
      "song": {...}
    }
  }
}
```

### Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "No split sheet found for this song",
  "data": null
}
```

---

## 7. Get Split Sheet History ⭐ (NEW FEATURE)

**GET** `/split-sheets/song/:songId/history`

Retrieves complete version history for all split sheets of a song. This is the key new feature that provides full audit trail.

### URL Parameters
- `songId` (uuid, required): Song ID

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Splitsheet history retrieved successfully",
  "data": {
    "song": {
      "id": "song-id",
      "title": "Song Title",
      "uploadedBy": {
        "id": "user-id",
        "name": "User Name",
        "email": "user@example.com"
      }
    },
    "currentSplitSheetId": "current-splitsheet-id",
    "totalVersions": 3,
    "history": [
      {
        "id": "version-3-id",
        "version": 3,
        "status": "Active",
        "createdAt": "2025-01-28T12:00:00.000Z",
        "lastModifiedBy": "user-id",
        "replacedAt": null,
        "replacedBy": null,
        "previousVersionId": "version-2-id",
        "entries": [
          {
            "id": "entry-id",
            "recipientEmail": "artist@example.com",
            "recipientName": "Artist",
            "percentage": 45.0,
            "status": "ACTIVE",
            "userId": "user-id",
            "claimToken": "token"
          }
        ],
        "summary": {
          "totalCollaborators": 3,
          "activeCollaborators": 2,
          "pendingCollaborators": 1,
          "platformFeePercentage": 15.0
        }
      },
      {
        "id": "version-2-id",
        "version": 2,
        "status": "Archived",
        "createdAt": "2025-01-28T11:00:00.000Z",
        "replacedAt": "2025-01-28T12:00:00.000Z",
        "replacedBy": "user-id",
        "previousVersionId": "version-1-id",
        "entries": [...],
        "summary": {...}
      }
    ]
  }
}
```

---

## 8. Claim Split Entry

**POST** `/split-sheets/claim`

Allows a user to claim a split entry using a claim token.

### Request Body
```json
{
  "claimToken": "unique-claim-token-here"
}
```

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Split entry claimed successfully",
  "data": {
    "id": "entry-id",
    "recipientEmail": "user@example.com",
    "recipientName": "User Name",
    "percentage": 40.0,
    "status": "ACTIVE",
    "userId": "user-id",
    "claimToken": "claim-token"
  }
}
```

### Error Responses
```json
// 404 - Invalid token
{
  "statusCode": 404,
  "message": "Invalid claim token. Split entry not found."
}

// 400 - Already claimed
{
  "statusCode": 400,
  "message": "This split entry has already been claimed."
}

// 403 - Email mismatch
{
  "statusCode": 403,
  "message": "The email address on this split entry does not match your account email."
}

// 400 - Incomplete profile
{
  "statusCode": 400,
  "message": "Please complete your profile and add a payout method to claim this split."
}
```

---

## 9. Verify Claim Token

**GET** `/split-sheets/verify/:claimToken`

Verifies if a claim token is valid without claiming it. **No authentication required.**

### URL Parameters
- `claimToken` (string, required): Claim token to verify

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Valid claim token",
  "data": {
    "isValid": true,
    "entryDetails": {
      "songTitle": "Song Title",
      "percentage": 40.0,
      "email": "user@example.com"
    }
  }
}
```

### Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Invalid claim token",
  "data": {
    "isValid": false
  }
}
```

---

## 10. Resend Claim Email

**POST** `/split-sheets/resend-claim/:entryId`

Resends claim email for a pending split entry. Only song owner can resend.

### URL Parameters
- `entryId` (uuid, required): Split entry ID

### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Claim email resent successfully",
  "data": {
    "sent": true
  }
}
```

### Error Responses
```json
// 403 - Unauthorized
{
  "statusCode": 403,
  "message": "You are not authorized to resend claim emails for this entry",
  "data": { "sent": false }
}

// 400 - Not pending
{
  "statusCode": 400,
  "message": "Cannot resend claim email for non-pending entries",
  "data": { "sent": false }
}
```

---

## 11. Calculate Split Amount

**GET** `/split-sheets/calculate-split`

Utility endpoint to calculate split amounts.

### Query Parameters
- `amount` (number, required): Total amount to split
- `percentage` (number, required): Percentage for calculation

### Example
```
GET /split-sheets/calculate-split?amount=1000&percentage=40.5
```

### Response (200 OK)
```json
{
  "amount": 405.0
}
```

---

## Environment Variables for Postman

Create these variables in your Postman environment:

```json
{
  "baseUrl": "http://localhost:3000/api/v1",
  "accessToken": "your-jwt-token-here"
}
```

## Collection Structure

```
Split Sheets API/
├── Authentication/
│   └── Login (to get accessToken)
├── Split Sheets/
│   ├── Create Split Sheet
│   ├── Get Split Sheet by ID
│   ├── Update Split Sheet ⭐ (NEW VERSIONING)
│   ├── Get User Splits
│   ├── Get Split Sheet Entries
│   ├── Get Split Sheet by Song ID
│   ├── Get Split Sheet History ⭐ (NEW)
│   ├── Claim Split Entry
│   ├── Verify Claim Token
│   ├── Resend Claim Email
│   └── Calculate Split Amount
```

## Key Features of the New System

### 🆕 **Versioning Strategy**
- **Updates create new versions** instead of modifying existing entries
- **Complete audit trail** preserved for all changes
- **Clean queries** - no invalidated entries to filter out
- **Industry standard** approach (like Netflix/Spotify content management)

### 🆕 **Enhanced Authorization**
- **Song owner** can create/update splitsheets
- **Primary artist** can also create/update splitsheets
- **Dual permission system** for better collaboration

### 🆕 **Smart Notification System**
The update process categorizes collaborators as:
- **Removed**: Previously active, now removed from new version
- **Continuing**: Present in both old and new versions (may have percentage changes)
- **New**: Added in the new version

### 🆕 **Complete History Endpoint**
- **All versions** of splitsheets for a song
- **Summary statistics** per version
- **Replacement tracking** (who replaced what, when)
- **Version linking** (previousVersionId chains)

## Testing Scenarios

### 1. Complete Versioning Flow Test
```
1. POST /split-sheets (Create initial splitsheet v1)
2. PUT /split-sheets/:id (Update to v2)
3. PUT /split-sheets/:id (Update to v3)
4. GET /split-sheets/song/:songId/history (See all versions)
5. Verify current splitsheet points to v3
6. Verify v1 and v2 are archived
```

### 2. Authorization Test
```
1. Create splitsheet as song owner ✅
2. Create splitsheet as primary artist ✅
3. Try creating as random user ❌ (should fail)
4. Update as song owner ✅
5. Update as primary artist ✅
6. Try updating as random user ❌ (should fail)
```

### 3. Notification Test
```
1. Create splitsheet with 3 collaborators
2. Update splitsheet:
   - Remove 1 collaborator (should get removal email)
   - Keep 1 collaborator with same % (should get update email)
   - Keep 1 collaborator with different % (should get update email)
   - Add 1 new collaborator (should get fresh claim email)
```

### 4. Error Handling Test
```
1. Try creating duplicate splitsheets ❌
2. Try updating with invalid percentages ❌
3. Try updating paid out splitsheets ❌
4. Try claiming with wrong email ❌
5. Try unauthorized operations ❌
```

## Migration Notes

The system includes database migrations that:
- Add versioning fields to `split_sheets` table
- Add `currentSplitSheetId` to `songs` table
- Create proper foreign key relationships
- Migrate existing data to new structure

This ensures backward compatibility while enabling the new versioning features. 