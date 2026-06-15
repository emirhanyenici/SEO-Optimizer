// PM2 process tanımı — SEO Optimizer
//
// Kullanım (sunucuda, ~/app dizininde, build sonrası):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save
//   pm2 startup   # çıktıdaki sudo komutunu çalıştır (reboot'ta otomatik başlatma)
//
// Env değişkenleri .env.local'dan Next.js tarafından otomatik yüklenir
// (next start, .env.local'ı production'da da okur). Anahtarları burada TUTMA.

module.exports = {
  apps: [
    {
      name: 'seo-optimizer',
      cwd: __dirname + '/..',
      script: 'npm',
      args: 'start',
      instances: 1, // SSE + uzun istekler için tek instance; cluster kullanma
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      // Uzun analizler RAM kullanır; OOM'da yeniden başlat (ARM/24GB'de gerekmez)
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
