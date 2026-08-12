# Preview run doc — inventroity (Vite + React + Firebase)

## Reproduce uncommitted artifacts
- Install dependencies: `npm install` in the project root (`node_modules/` is gitignored).
- Env config: copy `.env` from the main checkout (`C:\Users\usl20\Downloads\inventroity\.env`) into the worktree root. It holds the `VITE_FIREBASE_*` keys the app needs; `.env.example` lists the expected keys (no secrets here).

## Run the dev server
- Script: `npm run dev` (vite), default port **5173**.
- Detached start on Windows (stdout and stderr must go to different files):
  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
  ```
- Confirm it survived: `powershell -NoProfile -Command "Get-Process -Id <pid>"`, then wait until `http://localhost:5173` answers before registering the preview.
