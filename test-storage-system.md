# 🧪 Storage System Comprehensive Test Plan

## 📋 Pre-Test Environment Setup

### Required Environment Variables
```bash
# Add these to your .env file:

# CRITICAL - Storage Paths
LOCAL_STORAGE_PATH=./uploads                    # Where files are stored permanently
API_BASE_URL=http://localhost:3000             # Your API base URL

# OPTIONAL - Storage Configuration
STORAGE_TYPE=local                              # 'local' or 's3'
STORAGE_BUCKET=local                           # For S3: your bucket name

# OPTIONAL - For S3 (if STORAGE_TYPE=s3)
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
```

### Verify Directory Structure
```bash
# These directories should exist/be created automatically:
./uploads/           # Main storage (LOCAL_STORAGE_PATH)
./uploads/tmp/       # Multer temp files (auto-created)
```

## 🔬 Test Scenarios

### 1. Small File Upload Test (≤50MB)
```bash
# Test with a small image
curl -X POST "http://localhost:3000/storage/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@small-image.jpg" \
  -F "type=image" \
  -F "isPublic=true"

# Expected Response:
{
  "id": "uuid-here",
  "filename": "small-image.jpg", 
  "key": "1234567890-abcdef.jpg",
  "url": "http://localhost:3000/storage/files/uuid-here",
  "size": 1234567,
  "status": "PENDING"
}
```

### 2. Large File Upload Test (>50MB)
```bash
# Test with large file - should trigger multipart
curl -X POST "http://localhost:3000/storage/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@large-video.mp4" \
  -F "type=video" \
  -F "isPublic=true"

# Expected Response (multipart redirect):
{
  "multipart": true,
  "uploadId": "upload_1234567890_abc123",
  "chunkSize": 5242880,
  "totalChunks": 12,
  "message": "File size exceeds 50MB. Use multipart upload endpoints.",
  "nextStep": "POST /storage/multipart/upload_1234567890_abc123/part/1 with first chunk"
}
```

### 3. File Access Test
```bash
# Test file download via public URL
curl -I "http://localhost:3000/storage/files/FILE_ID_HERE"

# Expected: 200 OK with proper headers:
# Content-Type: image/jpeg (or appropriate)
# Content-Disposition: inline; filename="original-name.jpg"
```

### 4. Force Multipart Test
```bash
# Force small file through multipart
curl -X POST "http://localhost:3000/storage/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@small-image.jpg" \
  -F "type=image" \
  -F "forceMultipart=true"

# Should return multipart response even for small files
```

## 🔍 What to Check After Each Test

### File System Checks
```bash
# 1. Verify temp directory is clean (no leftover files)
ls -la ./uploads/tmp/
# Should be empty or contain only current uploads

# 2. Verify permanent storage has files
ls -la ./uploads/
# Should contain uploaded files with generated keys

# 3. Check database entries
# Query your audio_files/image_files/video_files tables
# Verify entries exist and point to correct files
```

### Health Indicators ✅
- ✅ **Temp directory cleanup**: `./uploads/tmp/` should be empty after successful uploads
- ✅ **No orphaned DB entries**: Every DB entry should have corresponding file on disk
- ✅ **No orphaned files**: Every file on disk should have DB entry
- ✅ **Correct file access**: URLs should return files with proper headers
- ✅ **Error handling**: Failed uploads should clean up temp files

### Red Flags 🚨
- 🚨 **Growing temp directory**: Files accumulating in `./uploads/tmp/`
- 🚨 **ENOENT errors**: Server crashes when accessing non-existent files
- 🚨 **CORS errors**: Usually indicate server crashes (no response headers)
- 🚨 **Database inconsistency**: DB entries without files or vice versa

## 🐛 Common Issues & Fixes

### Issue: "ENOENT: no such file or directory"
**Fix**: Ensure `LOCAL_STORAGE_PATH` exists and is writable
```bash
mkdir -p ./uploads
chmod 755 ./uploads
```

### Issue: "Multipart upload parts not found"
**Fix**: Check chunk upload sequence - must upload parts 1,2,3... in order

### Issue: Files not accessible via URL
**Fix**: Verify `API_BASE_URL` environment variable matches your server

## 🧹 Cleanup Commands
```bash
# Clear all temp files (safe to run)
rm -rf ./uploads/tmp/*

# Clear all uploaded files (DESTRUCTIVE - only for testing)
rm -rf ./uploads/*
# Note: This will break existing DB references
```

## ✅ Success Criteria
After running all tests, you should have:
1. Files uploaded successfully (both small and large)
2. Clean temp directory
3. Accessible file URLs
4. Consistent database entries
5. No server crashes or CORS errors
6. Proper error handling and cleanup
