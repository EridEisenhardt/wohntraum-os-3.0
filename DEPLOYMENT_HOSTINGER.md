# Deployment: Wohntraum Rheinhessen OS auf Hostinger VPS

Next.js läuft als Node-Server (`next start`, Port 3000) hinter Nginx mit SSL.
Domain (Beispiel): **os.wohntraumrheinhessen.site** — überall an deine echte Domain anpassen.

---

## 0. Voraussetzungen
- Hostinger VPS (Ubuntu 22/24), SSH-Zugang (root oder sudo)
- VPS-IP-Adresse (steht im Hostinger-Panel: VPS → Übersicht)
- Zugriff auf die DNS-Verwaltung deiner Domain

## 1. DNS setzen
Im Hostinger-Panel (Domains → DNS-Zone) einen **A-Record** anlegen:
- Typ: `A` · Name: `os` (für os.wohntraumrheinhessen.site) · Wert: **VPS-IP** · TTL: 3600

(Propagierung kann bis zu 30 Min dauern.)

## 2. Per SSH einloggen
```
ssh root@DEINE-VPS-IP
```

## 3. Node.js 22, Nginx, PM2 installieren
```
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx
npm install -g pm2
node -v   # sollte v22.x zeigen
```

## 4. Projekt hochladen
Variante A – per Git (empfohlen, falls Repo vorhanden):
```
mkdir -p /var/www && cd /var/www
git clone DEIN-REPO wohntraum-os
```
Variante B – ZIP hochladen: Die Datei `wohntraum-os.zip` (von Claude bereitgestellt)
per Hostinger-Dateimanager oder SCP nach `/var/www/` laden und entpacken:
```
cd /var/www && unzip wohntraum-os.zip -d wohntraum-os
```
Danach sollte `/var/www/wohntraum-os/package.json` existieren.

## 5. Supabase-Zugang (.env.local)
Die `.env.local` ist bereits im Projekt enthalten (öffentlicher anon-Key, für Frontend ok).
Prüfen:
```
cat /var/www/wohntraum-os/.env.local
```
Sie muss enthalten:
```
NEXT_PUBLIC_SUPABASE_URL=https://jqzxctfqvcwbctpjksvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 6. Abhängigkeiten installieren & bauen
```
cd /var/www/wohntraum-os
npm ci || npm install
npm run build
```

## 7. Mit PM2 starten
```
cd /var/www/wohntraum-os
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # den ausgegebenen Befehl einmal ausführen (Autostart nach Reboot)
```
Test lokal auf dem Server:
```
curl -I http://127.0.0.1:3000   # sollte HTTP 200 liefern
```

## 8. Nginx einrichten
```
cp /var/www/wohntraum-os/deploy/nginx-wohntraum-os.conf /etc/nginx/sites-available/wohntraum-os
# Domain in der Datei anpassen (server_name), falls nötig:
nano /etc/nginx/sites-available/wohntraum-os
ln -s /etc/nginx/sites-available/wohntraum-os /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```
Jetzt sollte http://os.wohntraumrheinhessen.site die App zeigen.

## 9. SSL (HTTPS) mit Let's Encrypt
```
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d os.wohntraumrheinhessen.site
```
Certbot richtet die HTTPS-Weiterleitung automatisch ein und erneuert sich selbst.

## 10. Supabase auf Produktionsdomain einstellen (wichtig!)
Im Supabase-Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://os.wohntraumrheinhessen.site`
- Bei **Redirect URLs** ggf. dieselbe Domain ergänzen.

Sonst funktionieren Login-Bestätigungen/Weiterleitungen auf der Live-Domain nicht.

---

## Updates einspielen (später)
```
cd /var/www/wohntraum-os
git pull                 # oder neues ZIP entpacken
npm ci || npm install
npm run build
pm2 restart wohntraum-os
```

## Nützliche Befehle
```
pm2 status               # läuft die App?
pm2 logs wohntraum-os     # Live-Logs
pm2 restart wohntraum-os  # neu starten
systemctl status nginx    # Nginx-Status
```

## Sicherheit
- Nur der öffentliche `anon`-Key liegt im Frontend — das ist korrekt und unkritisch.
- Der `service_role`-Key gehört NIEMALS in dieses Projekt/Frontend.
- Firewall (optional): `ufw allow OpenSSH; ufw allow 'Nginx Full'; ufw enable`
