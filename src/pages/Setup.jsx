const ENV_KEYS = [
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
]

export default function Setup() {
  return (
    <div className="setup">
      <div style={{ fontSize: 48, marginBottom: 8 }}>🧺</div>
      <h2>החנות שלי — הגדרה ראשונית</h2>
      <p className="muted">
        כדי לשמור את הנתונים בענן (בחינם) צריך לחבר Firebase. בצע את השלבים הבאים פעם אחת:
      </p>

      <ol>
        <li>
          היכנס ל-<a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">console.firebase.google.com</a> עם חשבון Google שלך ולחץ <b>צור פרויקט</b>.
        </li>
        <li>
          תן שם לפרויקט (למשל <b>my-shop</b>) וצור אותו (אפשר לדלג על Google Analytics).
        </li>
        <li>
          בתפריט צדדי פתח <b>Authentication → Sign-in method</b> ובחר <b>Anonymous</b> ולחץ Enable.
        </li>
        <li>
          פתח <b>Firestore Database → Create database</b>. בחר מצב <b>Production</b>, ומיקום הקרוב אליך (למשל Europe-west1).
        </li>
        <li>
          פתח <b>Project settings → Your apps → Web app (</b><span dir="ltr">&lt;/&gt;</span><b>)</b>, וצור אפליקציה. העתק משם את ערכי התצורה.
        </li>
        <li>
          הוסף את הערכים לקובץ <span className="env-line">.env</span> בפרויקט (או כ-Variables ב-Vercel):
          <div className="code">{ENV_KEYS.map(([key]) => `${key}=...`).join('\n')}</div>
        </li>
        <li>
          התקן כללי אבטחה: בתוך Firebase פתח <b>Firestore Database → Rules</b> והדבק את התוכן הבא:
          <div className="code">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}</div>
        </li>
        <li>רענן את הדף — זהו! 🎉</li>
      </ol>

      <div className="card" style={{ background: 'var(--primary-softer)' }}>
        <div className="card-title" style={{ color: 'var(--primary-dark)' }}>מה זה כל שדה?</div>
        {ENV_KEYS.map(([key, label]) => (
          <div key={key} className="order-item">
            <div className="order-item-name" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span className="env-line">{key}</span>
              <span className="small muted" style={{ direction: 'ltr' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
