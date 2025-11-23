# Backend API Testing - cURL Commands

## 1. Create Super Admin (Run seed script first)
```bash
# Run the seed script
node d:\AMAN\Samaaroh\backend\scripts\createSuperAdmin.js
```

## 2. Authentication Endpoints

### Register a PLANNER_OWNER (Business Owner)
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Rajesh Kumar\",
    \"email\": \"rajesh@weddingplanner.com\",
    \"password\": \"password123\",
    \"phone\": \"9876543210\",
    \"organizationName\": \"Dream Weddings\",
    \"city\": \"Mumbai\"
  }"
```

### Login as PLANNER_OWNER
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"rajesh@weddingplanner.com\",
    \"password\": \"password123\"
  }"
```

### Login as SUPER_ADMIN
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@samaaroh.com\",
    \"password\": \"SuperAdmin@123\"
  }"
```

## 3. Client Endpoints

**Note:** Replace `YOUR_TOKEN_HERE` with the token from login response

### Create a Client
```bash
curl -X POST http://localhost:5001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{
    \"name\": \"Priya Sharma\",
    \"phone\": \"9123456789\",
    \"email\": \"priya.sharma@example.com\",
    \"city\": \"Delhi\",
    \"tags\": [\"VIP\", \"Referral\"],
    \"notes\": \"Referred by existing client\"
  }"
```

### Get All Clients (with pagination)
```bash
curl -X GET "http://localhost:5001/api/clients?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search Clients by Name
```bash
curl -X GET "http://localhost:5001/api/clients?search=Priya" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search Clients by Phone
```bash
curl -X GET "http://localhost:5001/api/clients?search=9123456789" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Filter Clients by Tags
```bash
curl -X GET "http://localhost:5001/api/clients?tags=VIP,Referral" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Single Client
```bash
curl -X GET http://localhost:5001/api/clients/CLIENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Client
```bash
curl -X PUT http://localhost:5001/api/clients/CLIENT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{
    \"name\": \"Priya Sharma Updated\",
    \"email\": \"priya.updated@example.com\",
    \"city\": \"New Delhi\"
  }"
```

### Delete Client (soft delete)
```bash
curl -X DELETE http://localhost:5001/api/clients/CLIENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4. Event Endpoints

### Create an Event
```bash
curl -X POST http://localhost:5001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{
    \"clientId\": \"CLIENT_ID_HERE\",
    \"eventName\": \"Sharma Wedding\",
    \"eventType\": \"wedding\",
    \"eventDate\": \"2025-12-15\",
    \"venue\": \"Taj Palace Hotel, Mumbai\",
    \"estimatedBudget\": 2500000,
    \"leadPlannerId\": \"USER_ID_HERE\",
    \"notes\": \"Grand wedding with 500 guests\"
  }"
```

### Get All Events (with filters)
```bash
curl -X GET "http://localhost:5001/api/events?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Filter Events by Status
```bash
curl -X GET "http://localhost:5001/api/events?status=booked" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Filter Events by Type
```bash
curl -X GET "http://localhost:5001/api/events?eventType=wedding" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Filter Events by Date Range
```bash
curl -X GET "http://localhost:5001/api/events?dateFrom=2025-11-01&dateTo=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Upcoming Events (Next 7 days)
```bash
curl -X GET http://localhost:5001/api/events/upcoming \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Event Statistics (for Dashboard)
```bash
curl -X GET http://localhost:5001/api/events/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Single Event
```bash
curl -X GET http://localhost:5001/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Event
```bash
curl -X PUT http://localhost:5001/api/events/EVENT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{
    \"eventName\": \"Sharma Grand Wedding\",
    \"status\": \"booked\",
    \"actualBudget\": 2800000,
    \"venue\": \"Taj Palace Hotel & Convention Center, Mumbai\"
  }"
```

### Delete Event (soft delete)
```bash
curl -X DELETE http://localhost:5001/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. Testing Workflow

### Step 1: Create Super Admin
```bash
node d:\AMAN\Samaaroh\backend\scripts\createSuperAdmin.js
```

### Step 2: Register a Business Owner
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Owner\",\"email\":\"owner@test.com\",\"password\":\"test123\",\"phone\":\"9876543210\",\"organizationName\":\"Test Events\",\"city\":\"Mumbai\"}"
```

### Step 3: Login and Get Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@test.com\",\"password\":\"test123\"}"
```

### Step 4: Create a Client (use token from Step 3)
```bash
curl -X POST http://localhost:5001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Test Client\",\"phone\":\"9123456789\",\"email\":\"client@test.com\",\"city\":\"Delhi\"}"
```

### Step 5: Create an Event (use clientId from Step 4 and userId from Step 3)
```bash
curl -X POST http://localhost:5001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"clientId\":\"CLIENT_ID\",\"eventName\":\"Test Wedding\",\"eventType\":\"wedding\",\"eventDate\":\"2025-12-25\",\"venue\":\"Test Venue\",\"estimatedBudget\":1000000,\"leadPlannerId\":\"USER_ID\"}"
```

## 6. Error Testing

### Try to create duplicate client (same phone in organization)
```bash
curl -X POST http://localhost:5001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Duplicate Client\",\"phone\":\"9123456789\",\"email\":\"duplicate@test.com\"}"
```
**Expected:** 400 error - "A record with this phone already exists"

### Try to create event with past date
```bash
curl -X POST http://localhost:5001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"clientId\":\"CLIENT_ID\",\"eventName\":\"Past Event\",\"eventType\":\"wedding\",\"eventDate\":\"2020-01-01\",\"venue\":\"Test\",\"estimatedBudget\":100000,\"leadPlannerId\":\"USER_ID\"}"
```
**Expected:** 400 error - "Event date cannot be in the past"

### Try to delete client with active events
```bash
curl -X DELETE http://localhost:5001/api/clients/CLIENT_ID_WITH_EVENTS \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** 400 error - "Cannot delete client with active events"

## Notes:
- Replace `YOUR_TOKEN_HERE` with actual JWT token from login
- Replace `CLIENT_ID_HERE`, `EVENT_ID_HERE`, `USER_ID_HERE` with actual IDs
- All dates should be in ISO format: YYYY-MM-DD
- Phone numbers must be 10 digits starting with 6-9 (Indian format)
- The backend runs on http://localhost:5001
