# 🚀 RatedAfrika Storage API - Postman Testing Guide

## 📋 **Environment Variables Required**

### **CRITICAL - Add to .env file:**
```bash
# API Configuration
API_BASE_URL=https://your-domain.com              # Your production server URL
LOCAL_STORAGE_PATH=/app/uploads                   # Server storage path

# Storage Configuration  
STORAGE_TYPE=local                                # 'local' or 's3'
STORAGE_BUCKET=ratedafrika-files                 # Bucket/namespace name

# Optional - For S3 Storage (if STORAGE_TYPE=s3)
AWS_BUCKET_NAME=your-s3-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY=AKIA...
AWS_SECRET_KEY=your-secret-key

# Optional - Upload Configuration
UPLOAD_DESTINATION=/app/uploads                   # Temp upload directory
```

---

## 🔐 **Authentication Setup**

All protected endpoints require JWT Bearer token:
```
Authorization: Bearer your_jwt_token_here
```

---

## 📁 **POSTMAN COLLECTION**

### **Collection: RatedAfrika Storage API**
Base URL: `{{BASE_URL}}` (set to your server URL)

---

## 🔥 **ENDPOINTS**

### **1. 📤 Single File Upload (≤50MB)**

**Endpoint:** `POST {{BASE_URL}}/storage/upload`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
file: [SELECT FILE] (binary)
type: audio|image|video (text)
isPublic: true|false (text)
forceMultipart: true|false (text, optional)
metadata: {"album":"My Album","artist":"Artist Name"} (text, optional JSON)
```

**Success Response (Single Upload):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "song.mp3",
  "originalFilename": "song.mp3", 
  "mimeType": "audio/mpeg",
  "size": 5242880,
  "key": "1635789123456-abc123.mp3",
  "bucket": "ratedafrika-files",
  "status": "PENDING",
  "isPublic": true,
  "url": "https://your-domain.com/storage/files/123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Success Response (Auto-Multipart >50MB):**
```json
{
  "multipart": true,
  "uploadId": "upload_1635789123456_abc123",
  "chunkSize": 5242880,
  "totalChunks": 12,
  "message": "File size exceeds 50MB. Use multipart upload endpoints.",
  "nextStep": "POST /storage/multipart/upload_1635789123456_abc123/part/1 with first chunk"
}
```

---

### **2. 🚀 Multipart Upload Initiate**

**Endpoint:** `POST {{BASE_URL}}/storage/multipart/initiate`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "video",
  "isPublic": true,
  "metadata": {
    "filename": "large-video.mp4",
    "description": "High quality video upload"
  },
  "chunkConfig": {
    "totalSize": 104857600,
    "chunkSize": 5242880
  }
}
```

**Success Response:**
```json
{
  "uploadId": "upload_1635789123456_def789",
  "message": "Multipart upload initiated successfully"
}
```

---

### **3. 📦 Upload Multipart Chunk**

**Endpoint:** `POST {{BASE_URL}}/storage/multipart/{{uploadId}}/part/{{chunkNumber}}`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: multipart/form-data
```

**Path Variables:**
- `uploadId`: From initiate response
- `chunkNumber`: 1, 2, 3, ... (sequential)

**Body (form-data):**
```
chunk: [SELECT CHUNK FILE] (binary)
```

**Success Response:**
```json
{
  "PartNumber": 1,
  "ETag": "chunk_key_identifier"
}
```

---

### **4. ✅ Complete Multipart Upload**

**Endpoint:** `POST {{BASE_URL}}/storage/multipart/{{uploadId}}/complete`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "video",
  "parts": [
    {"PartNumber": 1, "ETag": "chunk_key_1"},
    {"PartNumber": 2, "ETag": "chunk_key_2"},
    {"PartNumber": 3, "ETag": "chunk_key_3"}
  ],
  "metadata": {
    "title": "Final Video",
    "description": "Completed multipart upload"
  }
}
```

**Success Response:**
```json
{
  "id": "789e4567-e89b-12d3-a456-426614174999",
  "filename": "large-video.mp4",
  "size": 104857600,
  "status": "COMPLETE",
  "url": "https://your-domain.com/storage/files/789e4567-e89b-12d3-a456-426614174999",
  "createdAt": "2024-01-15T10:45:00.000Z"
}
```

---

### **5. ❌ Abort Multipart Upload**

**Endpoint:** `POST {{BASE_URL}}/storage/multipart/{{uploadId}}/abort`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

**Success Response:**
```json
{
  "message": "Multipart upload aborted successfully"
}
```

---

### **6. 🔗 Get File Access URL**

**Endpoint:** `GET {{BASE_URL}}/storage/{{fileId}}/url`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "URL generated successfully",
  "data": "https://your-domain.com/storage/files/123e4567-e89b-12d3-a456-426614174000"
}
```

---

### **7. 📄 Get Upload Details**

**Endpoint:** `GET {{BASE_URL}}/storage/{{fileId}}?type={{fileType}}`

**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

**Query Parameters:**
- `type`: audio|image|video (required)

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Upload details retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "song.mp3",
    "size": 5242880,
    "mimeType": "audio/mpeg",
    "status": "COMPLETE",
    "isPublic": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "album": "My Album",
      "artist": "Artist Name"
    }
  }
}
```

---

### **8. 🌐 Public File Access (No Auth)**

**Endpoint:** `GET {{BASE_URL}}/storage/files/{{fileId}}`

**Headers:** None required

**Response:** Binary file content with headers:
```
Content-Type: audio/mpeg
Content-Disposition: inline; filename="song.mp3"
```

---

## 🧪 **TESTING SCENARIOS**

### **Scenario 1: Small File Upload**
1. Use endpoint #1 with a file <50MB
2. Verify single upload response
3. Use endpoint #8 to access the file

### **Scenario 2: Large File Auto-Multipart**
1. Use endpoint #1 with a file >50MB
2. Should get multipart redirect response
3. Split file into 5MB chunks
4. Use endpoint #3 for each chunk
5. Use endpoint #4 to complete
6. Use endpoint #8 to access final file

### **Scenario 3: Manual Multipart**
1. Use endpoint #2 to initiate
2. Use endpoint #3 for chunks
3. Use endpoint #4 to complete
4. Use endpoint #7 to get details

### **Scenario 4: Force Small File Multipart**
1. Use endpoint #1 with `forceMultipart: true`
2. Should get multipart redirect even for small files

---

## 📊 **EXPECTED FILE SIZES & LIMITS**

- **Max single upload:** 50MB (auto-switches to multipart)
- **Max total file size:** 100MB (configurable)
- **Chunk size:** 5MB
- **Supported formats:** jpg, jpeg, png, gif, mp3, wav, mp4, mov

---

## 🚨 **COMMON ERROR RESPONSES**

### **400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file uploaded",
  "error": "Bad Request"
}
```

### **401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "File not found on storage"
}
```

### **413 Payload Too Large:**
```json
{
  "statusCode": 413,
  "message": "File too large"
}
```

### **500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Upload failed: [specific error]",
  "error": "Internal Server Error"
}
```

---

## 🔧 **POSTMAN ENVIRONMENT VARIABLES**

Create environment with:
```
BASE_URL: https://your-production-server.com
JWT_TOKEN: your_actual_jwt_token
```

---

## 🎯 **HEALTH CHECKS**

After testing, verify:
1. ✅ Files accessible via public URLs
2. ✅ Temp directory empty: `/app/uploads/tmp/`
3. ✅ No server crashes or CORS errors
4. ✅ Database entries match uploaded files

---

## 🚀 **READY TO TEST!**

Import this documentation into Postman and start testing your remote storage system. All endpoints are production-ready with proper error handling and cleanup.
