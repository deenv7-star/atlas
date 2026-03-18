# ATLAS — פריסה ל-App Store בלי Mac

## סקירה כללית

הפרויקט מוגדר ל-CI/CD מלא דרך GitHub Actions:
- **beta** lane → TestFlight (לבדיקות)
- **release** lane → App Store (לפרסום)

הכל רץ על macOS runner בענן. אתה לא צריך Mac.

---

## שלב 1 — הכן Repo פרטי לתעודות (Fastlane Match)

Match מאחסן את ה-certificates שלך מוצפנים ב-Git repo פרטי.

1. עבור ל-GitHub → צור repo חדש בשם **`atlas-certs`** (Private)
2. שמור את ה-URL: `https://github.com/YOUR_USER/atlas-certs`

---

## שלב 2 — צור App Store Connect API Key

1. כנס ל-[App Store Connect](https://appstoreconnect.apple.com)
2. עבור ל-**Users and Access → Integrations → App Store Connect API**
3. לחץ **+** → שם: `Atlas CI`, תפקיד: **App Manager**
4. הורד את קובץ ה-`.p8`
5. שמור:
   - **Key ID** (10 תווים, למשל `ABC1234567`)
   - **Issuer ID** (UUID, למשל `69a6de7e-...`)
   - תוכן ה-`.p8` (פתח בטקסט)

---

## שלב 3 — צור את האפליקציה ב-App Store Connect

1. App Store Connect → **My Apps → +** → New App
2. מלא:
   - **Name:** ATLAS — ניהול נכסי אירוח
   - **Bundle ID:** `com.atlas-il.app`
   - **SKU:** `atlas-il-001`
   - **Primary Language:** Hebrew
3. שמור

---

## שלב 4 — הוסף Secrets ל-GitHub

עבור ל-GitHub → **Settings → Secrets and variables → Actions → New repository secret**

הוסף את הסודות הבאים:

| Secret name | ערך |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | ה-Key ID משלב 2 |
| `APP_STORE_CONNECT_API_ISSUER_ID` | ה-Issuer ID משלב 2 |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | תוכן קובץ ה-`.p8` **מקודד ב-base64** |
| `MATCH_GIT_URL` | `https://github.com/YOUR_USER/atlas-certs` |
| `MATCH_PASSWORD` | סיסמה שתבחר (לא לשכוח!) |
| `MATCH_GIT_BASIC_AUTHORIZATION` | `base64("YOUR_GITHUB_USER:YOUR_GITHUB_PAT")` |

### איך מקודדים ב-base64?

**את קובץ ה-.p8:**
```bash
base64 -i AuthKey_XXXXXXXX.p8 | tr -d '\n'
```

**את MATCH_GIT_BASIC_AUTHORIZATION:**
```bash
echo -n "your_github_username:ghp_YOUR_PERSONAL_ACCESS_TOKEN" | base64
```

> **GitHub PAT:** Settings → Developer settings → Personal access tokens → Generate new token
> נדרש scope: `repo` (כדי לגשת ל-atlas-certs)

---

## שלב 5 — הפעל את Match לראשונה (יצירת תעודות)

זה השלב היחידי שדורש הרצה ידנית. אפשר לעשות אותו מכל מחשב עם Ruby:

```bash
# התקן Ruby ו-Bundler אם צריך
gem install bundler

# התקן Fastlane
bundle install

# צור תעודות App Store ושמור אותן ב-atlas-certs
MATCH_GIT_URL="https://github.com/YOUR_USER/atlas-certs" \
MATCH_PASSWORD="הסיסמה שבחרת" \
bundle exec fastlane match appstore --app-identifier com.atlas-il.app
```

> **אין לך Ruby?** אפשר להשתמש ב-GitHub Codespaces — זה ממחשב ב-GitHub עצמו, בחינם.

---

## שלב 6 — הפעל את ה-Pipeline

### TestFlight (לבדיקות):
```
GitHub → Actions → iOS — Build & Deploy → Run workflow → beta
```

### App Store (לפרסום):
```
GitHub → Actions → iOS — Build & Deploy → Run workflow → release
```

או פשוט לדחוף קוד ל-`main` — זה מפעיל beta אוטומטית.

---

## לוח זמנים

| שלב | זמן |
|---|---|
| Build web app | ~2 דקות |
| CocoaPods install | ~3 דקות |
| Xcode build + archive | ~10 דקות |
| Upload to TestFlight | ~3 דקות |
| **סה"כ** | **~18 דקות** |

---

## פתרון תקלות

**`match` נכשל — authentication:**
- ודא ש-`MATCH_GIT_BASIC_AUTHORIZATION` נכון (base64 של `user:token`)
- ודא ש-PAT יש לו הרשאות `repo`

**`gym` נכשל — provisioning profile not found:**
- הרץ שוב `bundle exec fastlane match appstore` עם `--force`

**Build נכשל — Bundle ID לא קיים:**
- ודא שיצרת את האפליקציה ב-App Store Connect (שלב 3)

**הגרסה לא מופיעה ב-TestFlight:**
- תהליך הבדיקה של Apple לוקח 15-30 דקות
- בדוק email מ-Apple ("Your build has finished processing")
