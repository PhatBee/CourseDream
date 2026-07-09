# Project TODO

## Bug: API loop on `/api/users/profile`

- [x] Identify failing request URL pattern between client and server for profile endpoint.
- [ ] Fix axios refresh/retry logic to avoid re-entering refresh flow and infinite retries.
- [x] Fix instructorApi endpoint construction (was partially using /instructor/* without /api prefix).

- [x] Fix client API base prefixes for `/api/users/profile` (and `/api/instructor/*`) since `VITE_API_URL` does not include `/api`.

- [x] Ensure `userApi` calls the correct base path (`/api/v1/users/profile` vs `/api/users/profile`), depending on `VITE_API_URL`.
- [ ] Reduce profile-fetch storms in `MyProfile` (only fetch once when needed).


