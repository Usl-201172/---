# 🧺 החנות שלי — ניהול פירות וירקות

אפליקציית רשת (PWA) לניהול מוצרים, מלאי והזמנות — נגישה מהטלפון והמחשב, עם שמירה בענן.

## מה האפליקציה עושה

- **מוצרים**: קטלוג עם שם, מחיר מכירה, מחיר רכש, קטגוריה (ירקות/פירות/אחר), יחידת מכירה (יחידות או ק"ג) וניהול מלאי עם אזהרות מלאי נמוך.
- **הזמנות**: שם לקוח, בחירת מוצרים מהקטלוג, הוספת פריטים חד-פעמיים (כמו הנחה), חישוב סה"כ אוטומטי, אמצעי תשלום (ביט / פייבוקס / מזומן), סימון "שולם" ו"הגיע" והערות חופשיות.
- **מלאי אוטומטי**: יצירת הזמנה מחסירה מהמלאי, מחיקת הזמנה מחזירה אותו.
- **דשבורד**: הכנסות היום, חובות פתוחים, אזהרות מלאי נמוך והזמנות אחרונות.
- **PWA**: אפשר להתקין על מסך הבית של הטלפון — עובד כל הזמן, גם בלי חיבור.
- עברית מלאה, ממשק מותאם למובייל.

## טכנולוגיות

React + Vite + PWA · Firebase (Firestore + Anonymous Auth) · פריסה ב-Vercel

## ריצה מקומית

```bash
npm install
npm run dev
```

## הגדרה ראשונית (חובה — חיבור לענן)

האפליקציה תשמור נתונים ב-Firebase (חינם). עשה זאת פעם אחת:

1. היכנס ל-**[console.firebase.google.com](https://console.firebase.google.com)** עם חשבון Google ולחץ **צור פרויקט**.
2. **Authentication → Sign-in method** → הפעל **Anonymous**.
3. **Firestore Database → Create database** → מצב **Production**, מיקום קרוב אליך (למשל Europe-west1).
4. **Project settings → Your apps → Web app** — צור אפליקציה והעתק את ששת ערכי התצורה.
5. הכנס את הערכים לקובץ `.env` (ראה `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
6. התקן את כללי האבטחה: ב-Firebase פתח **Firestore Database → Rules** והדבק את תוכן `firestore.rules`:

   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## העלאה ל-Vercel

1. צור ריפו חדש ב-GitHub והעלה את הקוד:
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/<המשתמש-שלך>/<שם-הריפו>.git
   git push -u origin main
   ```
2. היכנס ל-**[vercel.com](https://vercel.com)** → **Add New → Project** → ייבא את הריפו מ-GitHub.
3. הוסף את ששת המשתנים מ-.env כ-**Environment Variables** ב-Vercel (אותם ערכים).
4. לחץ **Deploy** — האתר עולה עם כתובת כמו `https://your-app.vercel.app`.

## התקנה על הטלפון

1. פתח את כתובת האתר בדפדפן הטלפון (Chrome באנדרואיד / Safari באייפון).
2. לחץ בתפריט הדפדפן על **הוסף למסך הבית / Add to Home Screen**.
3. מכאן זה נפתח כמו אפליקציה רגילה — תמיד זמין.

## פיתוח

| פקודה | מה היא עושה |
| --- | --- |
| `npm run dev` | שרת פיתוח |
| `npm run build` | בניית גרסה סופית |
| `npm run preview` | בדיקת הבנייה |
| `npm run lint` | בדיקת קוד |
| `npm run icons` | יצירת אייקוני האפליקציה מ-`public/icons/icon.svg` |
