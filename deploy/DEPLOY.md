# Deployment Runbook — SEO Optimizer (Oracle Cloud Always Free + zenovaapp.com)

Bu uygulama **SSE streaming** ile ~13 dakikaya kadar süren canlı analizler yapar.
Bu yüzden Vercel/Cloudflare Pages gibi serverless platformlar **uygun değildir**;
gerçek, uzun çalışan bir Node sunucusu gerekir. Aşağıdaki kurulum **ücretsizdir**.

> **Faturalandırma notu:** Sunucu, `console.anthropic.com`'dan alınan bir
> **API anahtarı** ile çalışır. Bu, Claude Pro/Max **üyeliğinden ayrıdır** ve
> token başına faturalanır. Tüm çağrılar en ucuz model olan `claude-haiku-4-5`
> ile yapıldığından maliyet düşüktür. Anthropic hesabına aylık harcama limiti
> koyman önerilir.

---

## 0. ÖNCE: API anahtarlarını yenile (rotate)
Geliştirme sırasında kullanılan anahtarlar açığa çıkmış olabilir. Yenile:
- **Anthropic:** https://console.anthropic.com → eski key'i sil, yeni oluştur.
- **SerpAPI:** https://serpapi.com/manage-api-key → regenerate.
- **Google PageSpeed:** https://console.cloud.google.com → API key regenerate/kısıtla.

Yeni anahtarlar yalnızca sunucudaki `.env.local`'a yazılır (asla commit edilmez).

---

## 1. Oracle Cloud Always Free VM oluştur
1. https://www.oracle.com/cloud/free/ → "Start for free" (doğrulama için kart girilir, **para çekilmez**).
2. **Compute → Instances → Create Instance:**
   - Image: **Ubuntu 22.04**
   - Shape: **VM.Standard.A1.Flex (Ampere/ARM)** — Always Free, 2–4 OCPU / 12–24GB RAM.
     - ARM "out of capacity" hatası verirse: **VM.Standard.E2.1.Micro** (1GB RAM) seç, Adım 4'te swap ekle.
   - SSH key: kendi public key'ini ekle (yoksa lokalde `ssh-keygen`).
3. **Public IP**'yi not al.
4. **Networking → VCN → Security List → Ingress Rules** ekle: `0.0.0.0/0` için **TCP 80** ve **TCP 443**.

## 2. DNS: zenovaapp.com → sunucu IP
zenovaapp.com DNS panelinde A kaydı ekle:
- `@`   → `<PUBLIC_IP>`
- `www` → `<PUBLIC_IP>`
- **Cloudflare kullanıyorsan turuncu bulutu KAPAT (DNS only / gri bulut)** — proxy 100s'de SSE'yi keser, Certbot'u zorlaştırır.
- Doğrula: `dig zenovaapp.com +short` (yayılma 5dk–1saat).

## 3. Sunucuya bağlan, temel kurulum
```bash
ssh ubuntu@<PUBLIC_IP>
sudo apt update && sudo apt upgrade -y

# Sunucu içi firewall (Oracle Ubuntu iptables kullanır)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Node 20 LTS + araçlar
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2
```

## 4. (Sadece 1GB micro shape ise) swap ekle
```bash
sudo fallocate -l 3G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
ARM/24GB shape kullandıysan bu adımı atla.

## 5. Kodu çek, env gir, build et
```bash
cd ~
git clone https://github.com/emirhanyenici/SEO-Optimizer.git app
cd app

cp .env.example .env.local
nano .env.local        # YENİLENMİŞ anahtarları gir (en az ANTHROPIC_API_KEY)
chmod 600 .env.local

npm ci
npm run build
```

## 6. PM2 ile çalıştır (kalıcı + reboot'ta otomatik)
```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup            # çıktıdaki sudo komutunu kopyalayıp çalıştır
curl -I http://127.0.0.1:3000   # 200/307 dönmeli
```

## 7. Nginx + HTTPS
```bash
sudo cp ~/app/deploy/nginx.conf /etc/nginx/sites-available/seo-optimizer
sudo ln -s /etc/nginx/sites-available/seo-optimizer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d zenovaapp.com -d www.zenovaapp.com --redirect \
  -m emirhanync@gmail.com --agree-tos -n
```
Certbot 443 bloğunu ekler, HTTP→HTTPS yönlendirir, 90 günde bir oto-yeniler.

---

## Doğrulama (end-to-end)
1. **https://zenovaapp.com** → yeşil kilit, ana sayfa açılıyor.
2. Analiz başlat (`https://example.com` + anahtar kelime) → agent event'leri **canlı akıyor** (SSE OK).
3. Birkaç dakika boyunca bağlantı kopmuyor → uzun istek/timeout ayarı doğru.
4. Rapor gelince **PDF indir** → dosya iniyor (Türkçe karakterler düzgün).
5. Sağlık: `pm2 status`, `pm2 logs seo-optimizer --lines 50`, `sudo tail -f /var/log/nginx/error.log`.
6. Reboot testi: `sudo reboot` → ~1 dk sonra site kendiliğinden ayakta.

## Güncelleme (sonraki deploy'lar)
```bash
cd ~/app && git pull && npm ci && npm run build && pm2 restart seo-optimizer
```

## Güvenlik
- Anahtarlar yalnızca `.env.local`'da (chmod 600), repoda değil. Hepsi server-side — tarayıcıya sızmaz.
- Sadece 22/80/443 açık; 3000 yalnızca localhost.
- Opsiyonel sertleştirme: `fail2ban`, SSH'ta sadece key ile giriş, `unattended-upgrades`.
