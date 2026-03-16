# ATLAS — הגדרת משתני סביבה

> העתק את הקובץ `.env.example` ל-`.env` בתיקיית הפרויקט הראשית, ומלא את הערכים הבאים.

---

## משתני Frontend (קידומת `VITE_`)

| משתנה | חובה | ערך לדוגמה | הסבר |
|-------|------|------------|------|
| `VITE_APP_ID` | ✅ | `atlas-standalone` | מזהה ייחודי של האפליקציה |
| `VITE_APP_BASE_URL` | אופציונלי | `http://localhost:5173` | כתובת הבסיס של הפרונטאנד |
| `VITE_SUPABASE_URL` | אופציונלי* | `https://xxxx.supabase.co` | כתובת פרויקט Supabase |
| `VITE_SUPABASE_ANON_KEY` | אופציונלי* | `eyJhbGc...` | מפתח ציבורי של Supabase |
| `VITE_OPENAI_API_KEY` | אופציונלי | `sk-...` | מפתח OpenAI לתכונות AI |
| `VITE_STRIPE_PUBLISHABLE_KEY` | אופציונלי | `pk_live_...` | מפתח ציבורי של Stripe לתשלומים |

> \* אם `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` מוגדרים — המערכת תשתמש ב-Supabase.
> אם לא — תתחבר לשרת Express המקומי. אם גם הוא לא זמין — תשמור נתונים ב-localStorage.

---

## משתני Backend (שרת Express — קובץ `.env` נפרד בתיקיית הפרויקט)

### הגדרות בסיסיות

| משתנה | חובה | ערך לדוגמה | הסבר |
|-------|------|------------|------|
| `NODE_ENV` | ✅ | `development` / `production` | סביבת הרצה |
| `PORT` | ✅ | `3001` | פורט שרת ה-Express |
| `FRONTEND_URL` | ✅ | `http://localhost:5173` | כתובת הפרונטאנד (לצורך CORS) |

### מסד נתונים

| משתנה | חובה | ערך לדוגמה | היכן למצוא |
|-------|------|------------|------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@localhost:5432/atlas_db` | מחרוזת החיבור ל-PostgreSQL. ניתן לקבל מ-Supabase Dashboard → Settings → Database → Connection String |

### אימות (JWT)

| משתנה | חובה | ערך לדוגמה | הסבר |
|-------|------|------------|------|
| `JWT_SECRET` | ✅ | `min-32-chars-random-string-here` | מפתח סודי לחתימת JWT. צור עם: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | ✅ | `15m` | תוקף access token (דקות/שעות) |
| `REFRESH_TOKEN_TTL_DAYS` | ✅ | `30` | תוקף refresh token בימים |

### Rate Limiting

| משתנה | ברירת מחדל | הסבר |
|-------|-----------|------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | חלון זמן בmilliseconds (ברירת מחדל: דקה אחת) |
| `RATE_LIMIT_MAX` | `100` | מספר בקשות מקסימלי לחלון זמן |

### שמירת נתונים

| משתנה | ברירת מחדל | הסבר |
|-------|-----------|------|
| `DATA_RETENTION_DAYS` | `365` | מספר ימים לשמירת logs |

### אופציונליים

| משתנה | הסבר | היכן למצוא |
|-------|------|------------|
| `REDIS_URL` | כתובת שרת Redis לcaching | `redis://localhost:6379` |
| `SENTRY_DSN` | DSN של Sentry למעקב שגיאות | Sentry Dashboard → Project → Settings → DSN |
| `JWT_ACCESS_SECRET` | מפתח נפרד ל-access token (אם רוצים הפרדה מ-`JWT_SECRET`) | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | מפתח נפרד ל-refresh token | `openssl rand -hex 32` |
| `ACCESS_TOKEN_TTL` | תוקף access token (חלופה ל-`JWT_EXPIRES_IN`) | `900` (שניות) |

### אחסון קבצים (S3-compatible)

| משתנה | הסבר |
|-------|------|
| `S3_ENDPOINT` | כתובת שרת S3 (Supabase Storage / AWS / MinIO) |
| `S3_REGION` | אזור (למשל: `us-east-1`) |
| `S3_ACCESS_KEY` | מפתח גישה |
| `S3_SECRET_KEY` | מפתח סודי |
| `S3_BUCKET` | שם ה-bucket |

---

## קובץ `.env` לדוגמה (מינימלי להרצה מקומית)

```env
# ── Frontend ──
VITE_APP_ID=atlas-standalone
VITE_APP_BASE_URL=http://localhost:5173

# ── Backend ──
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# מסד נתונים — שנה לפרטי ה-PostgreSQL שלך
DATABASE_URL=postgresql://atlas_user:atlas_local_pw_2024@127.0.0.1:5432/atlas_db

# JWT — החלף במחרוזת אקראית ארוכה!
JWT_SECRET=replace-this-with-a-long-random-string-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=30

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
DATA_RETENTION_DAYS=365
```

---

## הגדרת Supabase (אם משתמשים ב-Supabase)

1. היכנס ל-[supabase.com](https://supabase.com) וצור פרויקט חדש
2. עבור ל-**Settings → API**:
   - העתק את **Project URL** → `VITE_SUPABASE_URL`
   - העתק את **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. עבור ל-**Settings → Database → Connection String → URI**:
   - העתק את המחרוזת → `DATABASE_URL`

---

## פקודות הרצה

```bash
# התקנת dependencies
npm install

# הרצת dev (frontend + backend ביחד)
npm run dev

# בנייה לproduction
npm run build

# הרצת הבנייה בלבד
npm run preview
```

---

## פתרון בעיות נפוצות

| שגיאה | פתרון |
|-------|-------|
| `Cannot connect to database` | ודא ש-PostgreSQL רץ ושמחרוזת `DATABASE_URL` נכונה |
| `JWT_SECRET must be at least 32 chars` | הארך את ערך `JWT_SECRET` |
| `CORS error` | ודא ש-`FRONTEND_URL` תואם לכתובת שבה רץ ה-Vite dev server |
| `Supabase not configured` | המערכת עוברת אוטומטית ל-localStorage — זה תקין לפיתוח |
