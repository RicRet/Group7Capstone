# This is Eagle Guide
## For our dev:

MAKE SURE TO CD TO EagleGuide before running commands

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
      npx expo start --tunnel
   ```
Must run with --tunnel in order to be able to load application in other device

3. Open in web
   once project is loaded please load once in web, before attempting to use QR code


PLEASE KEEP TRACK OF ALL NPM INSTALLS/PACKAGES/MODULES HERE:
   ```bash
      npm install axios
      npm install react-native
      npm install react-native-maps
      npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
   ```

AXIOS

## API configuration

- The app reads the backend URL from `app.json` under `expo.extra.apiBaseUrl`.
- Currently set to: `http://18.117.146.190:8080`
- The shared API client automatically prefixes `/v1` for versioned routes.

Update the base URL if the server changes:

1. Edit `EagleGuide/app.json`:

    ```json
    {
       "expo": {
          "extra": { "apiBaseUrl": "http://YOUR_HOST:PORT" }
       }
    }
    ```

2. Restart the Expo dev server to apply changes.

### Calling the API in code

- Import and use the shared client functions from `app/lib/api/*`.
- Example health check (already wired in `app/test.tsx`):

```ts
import { getHealth } from "./lib/api/health";
const data = await getHealth(); // { ok: true }
```

Notes:
- On Web, CORS must be enabled on the API for browser access.
- On Android release builds over HTTP, you may need to allow cleartext traffic.

## Sessions (using API Redis)

- Login returns an opaque `token` (session id) from `POST /v1/auth/login`.
- Add the header `Authorization: Bearer <token>` on protected requests.
- The API stores sessions in Redis and refreshes TTL on each request.

### Frontend usage

- Store the `token` securely (for now, AsyncStorage is acceptable for dev):

```ts
// We provide a SessionProvider + axios interceptor.
// Wrap your app in SessionProvider (see app/_layout.tsx).
// After login, axios auto-sends Authorization: Bearer <token>.
```
```

- Example: `GET /v1/users/me`

```ts
import { http } from "./lib/http";
export async function getMe() {
   const res = await http.get("/v1/users/me");
   return res.data;
}
```

### Screens to update

- `app/Login.tsx`: on success, save `token` and navigate.
- `app/homepage.tsx` or `app/_layout.tsx`: bootstrap session by reading stored token.
- `app/map.tsx` and other protected screens: use `authFetch` for calls that require a session.

### Logout

With SessionProvider, call `logout()` from `useSession()`; it clears token and header.

Optional: We can centralize session state with React Context or Zustand and wrap `authFetch` globally. Ask if you want me to scaffold that next.
