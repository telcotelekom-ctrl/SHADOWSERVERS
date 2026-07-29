# Server B Runtime

This runtime hosts the legacy portal archive and provides:

- Legacy file serving under /legacy/
- Authentication endpoints under /server/auth/*
- Investor calculation APIs under /server/api/investor/*
- Workspace/profile storage under /server/api/workspaces and /server/api/profiles
- A schema endpoint for future database integration
- PSY-TEL Hotspot Studio broadcast layer (WebSocket at /psy-tel, contact/SMTP, QR code, Spotify key matching)

## Local start

```bash
node server/server.js
```

## Default admin

- Email: raymond@serverb.local
- Password: serverb2026

## Real operation (PSY-TEL Hotspot Studio)

Environment variables are loaded from `server/.env` (already created, gitignored).
Copy `server/.env.example` if you need a fresh template. Edit `server/.env`
directly in the editor — never share these values in chat.

| Variable | Purpose |
| --- | --- |
| `PSY_TEL_ACCESS_CODE` | Passcode to unlock the hotspot broadcast panel |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO` | Real mail delivery for the contact form (nodemailer) |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Client Credentials flow for key-matched track search |
| `PORT` | Runtime port (default 3000) |

After editing `server/.env`, restart the server so the new values are loaded:

```bash
node server/server.js
```

Check `/server/api/hotspot/config-status` (or the badges in the studio UI) to
confirm which integrations are active without exposing the secret values.

## Vollständige Server-Dokumentation

Eine komplette Struktur- und Funktionsdokumentation für den gesamten Server-Ordner befindet sich in [SERVER_DOCUMENTATION.md](SERVER_DOCUMENTATION.md).
