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
