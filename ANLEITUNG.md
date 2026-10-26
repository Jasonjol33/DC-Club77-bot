# Bot auf Fly.io deployen (24/7)

Ordner-Inhalt: index.js, package.json, Dockerfile, fly.toml, .dockerignore

## 1. Einmalig vorbereiten
1. Account auf https://fly.io erstellen (Kreditkarte nötig).
2. flyctl installieren:
   - Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`
   - Mac/Linux: `curl -L https://fly.io/install.sh | sh`
3. Einloggen: `fly auth login`

## 2. App anlegen (im Bot-Ordner)
```
fly launch --no-deploy --copy-config
```
- Bei "Overwrite fly.toml?" -> **Nein**. Falls der Name vergeben ist, einen anderen wählen.
- Keine Datenbank, kein Redis, kein Deploy jetzt.

## 3. Geheimnisse setzen (statt .env)
Ersetze die Werte durch deine echten:
```
fly secrets set TOKEN="dein_token" CLIENT_ID="123" GUILD_ID="456" STAFF_ROLE_IDS="111,222" LOG_CHANNEL_ID="..." URLAUB_CHANNEL_ID="..." TICKET_CHANNEL_ID="..." EVENT_CHANNEL_ID="..."
```
Optional zusätzlich: BANNER_URL, LOGO_URL, DM_ENABLED, ROLES_EINSTELLEN, ROLES_EVENT usw.

## 4. Starten
```
fly deploy --ha=false
```
`--ha=false` sorgt dafür, dass nur **eine** Maschine läuft (sonst würde der Bot doppelt antworten).

## 5. Kontrolle
- Logs: `fly logs` -> es muss "✅ Eingeloggt als ..." erscheinen
- Status: `fly status`

## Updates
Nach Änderungen an index.js einfach wieder `fly deploy --ha=false`.
Secrets ändern: `fly secrets set NAME="wert"` (startet den Bot neu).
