# ATLAS — אפליקציה לאייפון

## שתי דרכים להשתמש ב-ATLAS באייפון

### 1. PWA — הוספה למסך הבית (מהיר, ללא App Store)

1. פתח את האתר **בספארי** באייפון: `https://atlas-il.com` (או הכתובת שלך)
2. לחץ על כפתור **השיתוף** (הריבוע עם החץ)
3. גלול ולחץ **"הוסף למסך הבית"**
4. אשר — האייקון יופיע במסך הבית כמו אפליקציה

**יתרונות:** אין צורך בהתקנה, עדכונים אוטומטיים, עובד גם offline (במגבלות)

---

### 2. אפליקציה native — דרך Xcode (לפרסום ב-App Store)

**דרישות:**
- Mac עם Xcode
- חשבון Apple Developer (99$/שנה לפרסום ב-App Store)

**שלבים:**

```bash
# 1. בניית האפליקציה
npm run build:ios

# 2. פתיחת Xcode (על Mac)
npm run ios
```

3. ב-Xcode: בחר סימולטור או מכשיר מחובר
4. לחץ Run (▶️) להרצה
5. לפרסום: Product → Archive → Distribute to App Store

**לעדכון אחרי שינויים:**
```bash
npm run build:ios
```
ואז ב-Xcode: Run מחדש

---

## קבצים רלוונטיים

| קובץ | תיאור |
|------|--------|
| `capacitor.config.ts` | הגדרות Capacitor (appId, webDir) |
| `ios/` | פרויקט Xcode |
| `public/manifest.json` | הגדרות PWA |
| `vite.config.js` | תוסף PWA (service worker) |
