# Presave API - Postman Testing Documentation

Complete testing guide for RatedFans Presave endpoints with standard edge case coverage.

## Quick Start

1. Import collection: `Presave-Testing.postman_collection.json`
2. Set `page_slug` environment variable to your test page
3. Run tests in order or use Collection Runner

---

## Endpoints

### 1. POST /r/:slug/presave - Sign Up for Presave
### 2. GET /r/presave/confirm - Confirm Email

---

## Test Coverage

### ✅ Happy Path Tests
- Valid signup with all required fields
- Email confirmation with valid token
- Same email on different platforms

### 🔴 Edge Cases
- Missing required fields
- Invalid email formats
- Invalid platforms
- Duplicate signups
- Non-existent pages
- Invalid tokens
- Type mismatches
- SQL injection attempts
- XSS attempts

---

## 1. Sign Up for Presave

**Endpoint:** `POST /r/:slug/presave`

### Valid Request

```http
POST http://localhost:3000/r/my-song/presave
Content-Type: application/json

{
  "email": "fan@example.com",
  "platform": "spotify",
  "metadata": {
    "source": "instagram"
  }
}
```

**Response 201 Created:**
```json
{
  "statusCode": 201,
  "message": "Successfully signed up. Please check your email to confirm.",
  "data": {
    "id": "presave-signup-uuid"
  }
}
```

### Valid Platforms
- `spotify`
- `apple_music`
- `youtube_music`
- `tidal`
- `deezer`
- `amazon_music`
- `soundcloud`

---

## Standard Edge Cases

### Edge Case 1: Missing Email

**Request:**
```json
{
  "platform": "spotify"
}
```

**Expected:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["email should not be empty", "email must be an email"],
  "error": "Bad Request"
}
```

**Test Script:**
```javascript
pm.test("Status code is 400", () => {
    pm.response.to.have.status(400);
});

pm.test("Error mentions email", () => {
    const body = pm.response.json();
    pm.expect(JSON.stringify(body.message)).to.include('email');
});
```

---

### Edge Case 2: Missing Platform

**Request:**
```json
{
  "email": "test@example.com"
}
```

**Expected:** `400 Bad Request`

---

### Edge Case 3: Invalid Email Format

**Test Cases:**
```json
// No @ symbol
{"email": "not-an-email", "platform": "spotify"}

// Missing domain
{"email": "test@", "platform": "spotify"}

// Missing local part
{"email": "@example.com", "platform": "spotify"}

// Spaces in email
{"email": "test user@example.com", "platform": "spotify"}

// Empty email
{"email": "", "platform": "spotify"}
```

**Expected:** All return `400 Bad Request`

**Test Script:**
```javascript
const invalidEmails = [
    'not-an-email',
    'test@',
    '@example.com',
    'test user@example.com',
    ''
];

// Run this in a loop or separate requests
invalidEmails.forEach(email => {
    pm.test(`Email "${email}" is rejected`, () => {
        // Expects 400 response
    });
});
```

---

### Edge Case 4: Invalid Platform

**Test Cases:**
```json
// Non-existent platform
{"email": "test@example.com", "platform": "myspace"}

// Wrong case
{"email": "test@example.com", "platform": "SPOTIFY"}

// With spaces
{"email": "test@example.com", "platform": "apple music"}

// Empty
{"email": "test@example.com", "platform": ""}
```

**Expected:** All return `400 Bad Request`

---

### Edge Case 5: Duplicate Signup

**First Request:**
```json
POST /r/my-song/presave
{
  "email": "duplicate@example.com",
  "platform": "spotify"
}
```
**Response:** `201 Created`

**Second Request (Same Email + Platform):**
```json
POST /r/my-song/presave
{
  "email": "duplicate@example.com",
  "platform": "spotify"
}
```
**Response:** `409 Conflict`
```json
{
  "statusCode": 409,
  "message": "Already signed up for presave on this platform"
}
```

**Test Script:**
```javascript
// First signup
pm.test("First signup succeeds", () => {
    pm.response.to.have.status(201);
});

// Second signup (run separately)
pm.test("Duplicate returns 409", () => {
    pm.response.to.have.status(409);
});

pm.test("Error mentions duplicate", () => {
    const body = pm.response.json();
    pm.expect(body.message.toLowerCase()).to.include('already');
});
```

---

### Edge Case 6: Same Email, Different Platform (ALLOWED)

**First Request:**
```json
{
  "email": "multi@example.com",
  "platform": "spotify"
}
```
**Response:** `201 Created`

**Second Request:**
```json
{
  "email": "multi@example.com",
  "platform": "apple_music"
}
```
**Response:** `201 Created` ✅

**Test:**
```javascript
pm.test("Different platform allowed", () => {
    pm.response.to.have.status(201);
});
```

---

### Edge Case 7: Non-existent Page

**Request:**
```http
POST /r/page-does-not-exist/presave
{
  "email": "test@example.com",
  "platform": "spotify"
}
```

**Expected:** `404 Not Found`
```json
{
  "statusCode": 404,
  "message": "Page not found or presave not enabled"
}
```

---

### Edge Case 8: Type Mismatches

**Email as Number:**
```json
{
  "email": 12345,
  "platform": "spotify"
}
```
**Expected:** `400 Bad Request`

**Email as Array:**
```json
{
  "email": ["test@example.com"],
  "platform": "spotify"
}
```
**Expected:** `400 Bad Request`

**Platform as Array:**
```json
{
  "email": "test@example.com",
  "platform": ["spotify", "apple_music"]
}
```
**Expected:** `400 Bad Request`

---

### Edge Case 9: SQL Injection (Security)

**Request:**
```json
{
  "email": "test@example.com'; DROP TABLE presave_signups; --",
  "platform": "spotify"
}
```

**Expected:** `400 Bad Request` (Invalid email format)

**Request in URL:**
```http
POST /r/' OR '1'='1/presave
```

**Expected:** `404 Not Found` (Parameterized queries prevent execution)

**Test:**
```javascript
pm.test("SQL injection prevented", () => {
    pm.response.to.have.status(400);
});

pm.test("No database error", () => {
    const body = pm.response.json();
    pm.expect(body.message).to.not.include('database');
    pm.expect(body.message).to.not.include('SQL');
});
```

---

### Edge Case 10: XSS Attempt (Security)

**Request:**
```json
{
  "email": "<script>alert('xss')</script>@example.com",
  "platform": "spotify"
}
```

**Expected:** `400 Bad Request` (Invalid email format)

---

## 2. Confirm Presave

**Endpoint:** `GET /r/presave/confirm?token={token}`

### Valid Confirmation

**Request:**
```http
GET http://localhost:3000/r/presave/confirm?token=abc123xyz789
```

**Expected:** `302 Found` (Redirect)
```
Location: http://frontend-url/presave/confirmed
```

**Test:**
```javascript
pm.test("Status code is 302", () => {
    pm.response.to.have.status(302);
});

pm.test("Redirects to success page", () => {
    const location = pm.response.headers.get("Location");
    pm.expect(location).to.include("/presave/confirmed");
});
```

---

### Edge Case 11: Invalid Token

**Request:**
```http
GET /r/presave/confirm?token=invalid-token-12345
```

**Expected:** `302 Found` (Redirect to error)
```
Location: http://frontend-url/presave/error?message=Invalid%20or%20expired%20confirmation%20token
```

**Test:**
```javascript
pm.test("Redirects to error page", () => {
    pm.response.to.have.status(302);
    const location = pm.response.headers.get("Location");
    pm.expect(location).to.include("/presave/error");
});
```

---

### Edge Case 12: Missing Token

**Request:**
```http
GET /r/presave/confirm
```

**Expected:** `302 Found` or `400 Bad Request`

---

### Edge Case 13: Empty Token

**Request:**
```http
GET /r/presave/confirm?token=
```

**Expected:** `302 Found` (Redirect to error)

---

### Edge Case 14: Already Confirmed Token

**Scenario:**
1. Confirm with valid token → Success (302 to success page)
2. Use same token again → Error (302 to error page)

**Test:**
```javascript
// First confirmation
pm.test("First confirmation succeeds", () => {
    pm.response.to.have.status(302);
    const location = pm.response.headers.get("Location");
    pm.expect(location).to.include("/presave/confirmed");
});

// Second confirmation (run separately)
pm.test("Second confirmation fails", () => {
    pm.response.to.have.status(302);
    const location = pm.response.headers.get("Location");
    pm.expect(location).to.include("/presave/error");
});
```

---

### Edge Case 15: SQL Injection in Token

**Request:**
```http
GET /r/presave/confirm?token=' OR '1'='1
```

**Expected:** `302 Found` (Redirect to error - no SQL execution)

---

## Postman Collection Setup

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000` | API base URL |
| `page_slug` | `test-page` | Valid page slug with presave enabled |
| `confirmation_token` | `` | Get from database after signup |
| `duplicate_test_email` | `` | Auto-generated in tests |

### Pre-request Script (Auto-generate Email)

```javascript
// Generate unique email for each test
const timestamp = Date.now();
const randomEmail = `testuser${timestamp}@example.com`;
pm.environment.set("test_email", randomEmail);
```

### Test Script Template

```javascript
// Status code validation
pm.test("Status code is correct", () => {
    pm.response.to.have.status(expectedStatus);
});

// Response structure
pm.test("Response has expected structure", () => {
    const body = pm.response.json();
    pm.expect(body).to.have.property('statusCode');
    pm.expect(body).to.have.property('message');
});

// Log results
console.log(`✅ Test: ${pm.info.requestName}`);
console.log(`Response time: ${pm.response.responseTime}ms`);
```

---

## Getting Confirmation Token

After signup, get the token from database:

```sql
SELECT confirmationToken, email, status 
FROM presave_signups 
WHERE email = 'your-test-email@example.com' 
ORDER BY createdAt DESC 
LIMIT 1;
```

Or check application logs:
```bash
tail -f logs/combined.log | grep "Presave"
```

---

## Test Execution Order

### Manual Testing
1. **Get Page Details** (optional - verify page exists)
2. **Valid Signup** - Should succeed (201)
3. **Duplicate Signup** - Should fail (409)
4. **Invalid Email** - Should fail (400)
5. **Invalid Platform** - Should fail (400)
6. **Get Token** - From database
7. **Valid Confirmation** - Should redirect to success (302)
8. **Duplicate Confirmation** - Should redirect to error (302)

### Automated Testing (Collection Runner)
Run all tests in sequence. Skip confirmation tests if you don't have valid tokens.

---

## Database Verification Queries

### Check Signup Created
```sql
SELECT * FROM presave_signups 
WHERE email = 'test@example.com' 
ORDER BY createdAt DESC;
```

### Check Duplicate Prevention
```sql
SELECT email, platform, COUNT(*) as count
FROM presave_signups
GROUP BY email, platform
HAVING COUNT(*) > 1;
```

### Check Confirmation Status
```sql
SELECT email, status, confirmedAt 
FROM presave_signups 
WHERE email = 'test@example.com';
```

---

## Common Test Scenarios

### Scenario 1: Complete Happy Path
```
1. POST signup → 201 Created
2. Check email logs → Token found
3. GET confirm → 302 to success page
4. Verify DB → status = 'CONFIRMED'
```

### Scenario 2: Duplicate Prevention
```
1. POST signup (email A + Spotify) → 201 Created
2. POST signup (email A + Spotify) → 409 Conflict ✅
3. POST signup (email A + Apple Music) → 201 Created ✅
```

### Scenario 3: Invalid Inputs
```
1. POST with invalid email → 400 Bad Request
2. POST with invalid platform → 400 Bad Request
3. POST to non-existent page → 404 Not Found
4. GET confirm with invalid token → 302 to error page
```

---

## Response Time Benchmarks

**Expected Response Times:**
- Signup (valid): < 500ms
- Signup (duplicate check): < 300ms
- Confirmation (valid): < 200ms
- Validation errors: < 100ms

**Test:**
```javascript
pm.test("Response time is acceptable", () => {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

## Error Response Formats

### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "platform must be a valid enum value"],
  "error": "Bad Request"
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Page not found or presave not enabled"
}
```

### Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Already signed up for presave on this platform"
}
```

### Server Error (500)
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Troubleshooting

### Issue: "Page not found"
**Solution:** Check page exists and has `isPresaveEnabled = true`
```sql
SELECT slug, isPresaveEnabled, isPublished 
FROM ratedfans_pages 
WHERE slug = 'your-slug';
```

### Issue: No confirmation email
**Solution:** Check logs for email sending
```bash
tail -f logs/combined.log | grep "Presave confirmation"
```

### Issue: 409 on first signup
**Solution:** Clean up test data
```sql
DELETE FROM presave_signups 
WHERE email LIKE 'testuser%@example.com';
```

### Issue: Configuration error
**Solution:** Set FRONTEND_URL in .env
```env
FRONTEND_URL=http://localhost:3001
```

---

## Best Practices

1. **Use unique emails** for each test run (timestamp-based)
2. **Clean up test data** after testing
3. **Test positive and negative cases**
4. **Verify database state** after operations
5. **Check logs** for email confirmations
6. **Test edge cases** systematically
7. **Use Collection Runner** for regression testing
8. **Document failures** with request/response data
9. **Test security** (SQL injection, XSS)
10. **Monitor response times**

---

**Last Updated:** October 24, 2025  
**API Version:** 1.0

