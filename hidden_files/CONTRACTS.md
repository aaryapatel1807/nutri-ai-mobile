# NutriAI Backend API Contracts — Mobile Reference

Source of truth: route files under `~/workspace/nutri-ai/app/backend/routes/` (mounted in `server.js`).
Read on 2026-10-02. No network calls were made against the backend.

**Base URL:** `https://nutriai-backend-nu.vercel.app`

## Auth (all endpoints)

- Protected endpoints require header: `Authorization: Bearer <accessToken>`
  - Access token = JWT, `token` field from login/register/refresh. **TTL 1 hour.**
  - Refresh token (`refreshToken` field) lasts 30 days, rotates on every use.
- Auth failures: `401 { "success": false, "error": "No token provided" }` or
  `401 { "success": false, "error": "Invalid token" }`
- General error shape (most endpoints): `{ "error": "<message>" }`
- Rate-limit shape: `{ "success": false, "error": "Too many requests", "retryAfter": <seconds> }`
- Success/status fields like `{ success: true }` are booleans, not wrapped.

## Auth

### POST https://nutriai-backend-nu.vercel.app/api/auth/register
- Auth: none. Body: `{ "name": string, "email": string, "password": string }` (password ≥ 10 chars)
- 201 → `{ "token": "<jwt>", "refreshToken": "<raw>", "user": { "id", "email", "name" } }`
- If email already exists: `201 { "message": "If this email is new, an account was created. Please sign in." }` — **no token returned.**
- 400 errors: `All fields required`, `Invalid email address`, `Password must be at least 10 characters`

### POST https://nutriai-backend-nu.vercel.app/api/auth/login
- Auth: none. Body: `{ "email": string, "password": string }`
- → `{ "token": "<jwt>", "refreshToken": "<raw>", "user": { ...full user minus password } }`
- 401 `{ "error": "Invalid email or password" }` (same for unknown email)

### POST https://nutriai-backend-nu.vercel.app/api/auth/refresh
- Auth: none. Body: `{ "refreshToken": string }`
- → `{ "token": "<new jwt>", "refreshToken": "<new raw>" }` — **rotation: the old refresh token is revoked; store the new pair.**
- 400 `{ "error": "Refresh token required" }`
- 401 `{ "error": "Session expired — please sign in again" }` — presenting a dead token **revokes all the user's refresh tokens**.

### POST https://nutriai-backend-nu.vercel.app/api/auth/logout
- Auth: none. Body: `{ "refreshToken": string }` OR `{ "all": true }` + `Authorization: Bearer <accessToken>` to revoke every session.
- → `{ "success": true }`

### GET https://nutriai-backend-nu.vercel.app/api/auth/me
- Auth: yes. → full user object minus `password`.

### PUT https://nutriai-backend-nu.vercel.app/api/auth/profile
- Auth: yes. Body: any of — strings: `name, phone, dob, gender, location, fitnessGoal, dietType, activityLevel`; floats: `height, weight, targetWeight, bodyFat, muscleMass, waterGoal, sleepGoal`; ints: `calorieGoal, proteinGoal, carbGoal, fatGoal`.
- BMI is recomputed server-side when height/weight change. → updated user minus `password`.

(Also: `/forgot-password` and `/reset-password` exist; skip for v1.)

## Meals

Meal object: `{ "id", "userId", "name", "calories", "protein", "carbs", "fat", "mealType", "date" }` (+ `createdAt`, `updatedAt`).
`mealType` ∈ `Breakfast | Lunch | Dinner | Snack`.

### GET https://nutriai-backend-nu.vercel.app/api/meals/today
- Auth: yes. Uses a 30h trailing window (handles timezone skew).
- → `{ "totalCalories", "protein", "carbs", "fat", "goalCalories", "meals": [...], "grouped": { "Breakfast": [...], "Lunch": [...], "Dinner": [...], "Snack": [...] } }`
- Note: macros are `protein`/`carbs`/`fat` (not `totalProtein`).

### GET https://nutriai-backend-nu.vercel.app/api/meals
- Auth: yes. → array of meal objects, newest first.

### GET https://nutriai-backend-nu.vercel.app/api/meals/weekly
- Auth: yes. → array of 7: `{ "day": "Mon"…, "cal", "protein", "carbs", "fat", "goal" }` (oldest→today).

### POST https://nutriai-backend-nu.vercel.app/api/meals
- Auth: yes. Body: `{ "name", "calories", "protein", "carbs", "fat", "mealType", "date"? }` (date = ISO string; defaults to now)
- 201 → created meal object. 400 `{ "error": "Invalid date" }`.

### DELETE https://nutriai-backend-nu.vercel.app/api/meals/:id
- Auth: yes. → `{ "success": true }`. 404 `{ "error": "Meal not found" }`.

## AI / ML (`/api/ml`) — Groq-backed, rate-limited

Limits: burst 30/min/user; **hard daily cap 100 AI calls/user** → `429 { "error": "Daily AI limit reached — please try again tomorrow", "retryAfter": 86400 }`. `503 { "error": "AI service not configured" }` if keys missing.

### POST https://nutriai-backend-nu.vercel.app/api/ml/chat
- Auth: yes. Body: `{ "message": string (≤4000 chars), "history"?: [{ "role": "user"|"assistant", "content": string }], "user_data"?: { "persona": "nutrition"|"workout"|"health"|"transformation" } }`
- → `{ "response": "<text>", "text": "<same text>" }` (both fields identical)
- 400 `{ "error": "message is required" }` / `message is too long…`

### POST https://nutriai-backend-nu.vercel.app/api/ml/detect-food
- Auth: yes. **multipart/form-data**, file field name = `image`, max 5MB (jpeg/png).
- → `{ "foods": [{ "name", "calories", "confidence" }], "total_calories": number }`; on parse failure `{ "foods": [], "total_calories": 0, "raw": "<text>" }`
- 400 `No image file uploaded`; 413 `Image too large (max 5MB)`.

### POST https://nutriai-backend-nu.vercel.app/api/ml/recipe-suggestions
- Auth: yes. Body: `{ "ingredients": [string], "dietary_preferences"?: [string], "meal_type"?: "any"|"breakfast"|"lunch"|"dinner"|"snack" }`
- → `{ "recipes": [{ "name", "ingredients": [], "instructions": "", "calories" }] }`

### POST https://nutriai-backend-nu.vercel.app/api/ml/nutrition-forecast
- Auth: yes. Body: `{ "historical_data"?: [...] }` → `{ "forecast": [], "recommendations": [] }`

## Barcode

### GET https://nutriai-backend-nu.vercel.app/api/barcode/:code
- Auth: yes. `:code` must be 4–20 digits (else 400 `{ "error": "Invalid barcode" }`).
- → `{ "code", "name", "brand", "calories", "protein", "carbs", "fat", "servingSize", "perServing": boolean, "image": string|null }`
- 404 `{ "error": "Product not found" }` (Open Food Facts backend).

### POST https://nutriai-backend-nu.vercel.app/api/barcode/log
- Auth: yes. Body: `{ "code": string, "mealType": "Breakfast"|"Lunch"|"Dinner"|"Snack" }`
- 201 → created meal object.

## Adaptive coaching

### GET https://nutriai-backend-nu.vercel.app/api/coaching/tdee
- Auth: yes.
- OK → `{ "status": "ok", "estimated": false, "learnedTDEE", "trendKgPerWeek", "avgIntake", "daysCovered", "weightReadings", "intakeDays", "confidence": "high"|"medium"|"low", "series": [{ "date": "YYYY-MM-DD", "weight" }] }`
- Not enough data (HTTP 200) → `{ "status": "insufficient_data", "reason", "need", "fallbackTDEE", "estimated": true }`. **Always handle this branch — show fallbackTDEE.**

### GET https://nutriai-backend-nu.vercel.app/api/coaching/targets
- Auth: yes. → `{ "calorieTarget", "proteinG", "carbsG", "fatG", "goal": "fat_loss"|"muscle_gain"|"maintain", "adjustment", "basedOn": "learned"|"estimate", "confidence": "high"|"medium"|"low"|null }`

### GET https://nutriai-backend-nu.vercel.app/api/coaching/readiness?soreness=1..5
- Auth: yes (soreness optional, default 3).
- → `{ "score": 0..100, "zone": "Peak"|"Primed"|"Steady"|"Recover", "suggestion": string, "soreness", "components": { "sleep": number|null, "strain", "soreness", "sessionsLast48h" }, "dataQuality": "good"|"partial"|"none" }`

## Workouts

Workout object: `{ "id", "userId", "name", "duration" (min), "calories", "category", "difficulty", "completedAt" }` (+ timestamps).

### GET https://nutriai-backend-nu.vercel.app/api/workouts
- Auth: yes. → array of workouts, newest first.

### GET https://nutriai-backend-nu.vercel.app/api/workouts/stats
- Auth: yes. → `{ "totalWorkouts", "thisWeek", "totalCaloriesBurned" }`

### POST https://nutriai-backend-nu.vercel.app/api/workouts
- Auth: yes. Body: `{ "name"?, "duration"?, "calories"?, "category"?, "difficulty"? }` → 201 workout object.

### PUT https://nutriai-backend-nu.vercel.app/api/workouts/:id
- Auth: yes. Body: partial workout fields. → updated workout. 404 `{ "error": "Workout not found" }`.

### DELETE https://nutriai-backend-nu.vercel.app/api/workouts/:id
- Auth: yes. → `{ "success": true }`.

## Stats

### GET https://nutriai-backend-nu.vercel.app/api/stats
- Auth: yes. → `{ "totalMeals", "totalWorkouts", "totalBadges", "streak" (days), "memberSince" (ISO), "calorieGoal", "proteinGoal", "carbGoal", "fatGoal" }`

## Water

Log object: `{ "id", "userId", "amountMl", "date" }` (+ timestamps).

### GET https://nutriai-backend-nu.vercel.app/api/water[?date=YYYY-MM-DD]
- Auth: yes (default: today). → `{ "logs": [...], "totalMl": number, "totalL": "1.50" (string, 2dp) }`

### GET https://nutriai-backend-nu.vercel.app/api/water/history
- Auth: yes. → array of logs, last 7 days, oldest first.

### POST https://nutriai-backend-nu.vercel.app/api/water
- Auth: yes. Body: `{ "amountMl": number }` (must be > 0) → 201 log object.

### DELETE https://nutriai-backend-nu.vercel.app/api/water/:id
- Auth: yes. → `{ "message": "Water log deleted" }`; 404 `Log not found`; 403 `Not authorized`.

## Weight

Log object: `{ "id", "userId", "weight" (kg), "date" }` (+ timestamps). POST also syncs `user.weight`.

### GET https://nutriai-backend-nu.vercel.app/api/weight
- Auth: yes. → last 90 logs, newest first.

### GET https://nutriai-backend-nu.vercel.app/api/weight/latest
- Auth: yes. → latest log or `null`.

### GET https://nutriai-backend-nu.vercel.app/api/weight/history
- Auth: yes. → last 30 days, oldest first.

### POST https://nutriai-backend-nu.vercel.app/api/weight
- Auth: yes. Body: `{ "weight": number }` (kg, > 0) → 201 log object. 400 `{ "error": "weight must be a positive number (kg)" }`.

### DELETE https://nutriai-backend-nu.vercel.app/api/weight/:id
- Auth: yes. → `{ "message": "Weight log deleted" }`; 404/403 as above.

## Sleep

Log object: `{ "id", "userId", "date" (UTC midnight), "hours", "quality" (1–5) }`.

### GET https://nutriai-backend-nu.vercel.app/api/sleep?days=30
- Auth: yes. → array of logs, oldest first (chart-friendly); max 90 days.

### POST https://nutriai-backend-nu.vercel.app/api/sleep
- Auth: yes. Body: `{ "date"?: ISO string (default today), "hours": 0–24, "quality": 1–5 }` → 201 log. **One log per day — re-posting a date overwrites.** Future dates rejected.

### DELETE https://nutriai-backend-nu.vercel.app/api/sleep/:id
- Auth: yes. → `{ "message": "Sleep log deleted" }`; 404/403 as above.

## Recipes (brief)

Recipe object: `{ "id", "userId", "title", "ingredients", "instructions", "calories", "protein", "carbs", "fat", "imageUrl", "createdAt" }`.

- `GET /api/recipes` → array, newest first.
- `GET /api/recipes/:id` → recipe; 404/403 if missing or not owner.
- `POST /api/recipes` — body: `{ "title", "ingredients", "instructions" }` required; optional `calories, protein, carbs, fat, imageUrl` → 201.
- `POST /api/recipes/import` — body: `{ "url": string }` → `{ "title", "ingredients": [], "instructions": [], "calories", "protein", "carbs", "fat", "sourceUrl" }` (draft, nothing saved).
- `PUT /api/recipes/:id` — partial update → updated recipe; `DELETE /api/recipes/:id` → `{ "message": "Recipe deleted" }`.

## Notes for mobile implementation

1. On 401 from any authed call, call `/auth/refresh` once with the stored refresh token; on 401 there too, force re-login.
2. After refresh, **replace both tokens** in secure storage (rotation).
3. IDs are Prisma string ids (cuids) — treat as opaque strings.
4. Dates arrive as ISO strings.
5. `/meals/today` already includes totals — don't compute client-side.
6. `detect-food` and `chat` count against the 100/day AI quota — debounce and show the 429 message to the user.
7. `coaching/tdee` returns HTTP 200 for both data states — branch on `status`/`estimated`, not the status code.
