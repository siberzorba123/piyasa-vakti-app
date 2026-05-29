# Piyasa Vakti

Arkadaş grupları için müsaitlik, aktivite uyumu, ulaşım ve bütçe paneli.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda terminalde çıkan `http://localhost:5173/` linkini aç.

## v3 değişiklikleri

- Uygulama adı Piyasa Vakti olarak kaldı.
- Müsaitliğim bölümünden koltuk alanı kaldırıldı.
- Ulaşım alanına araba ve motor seçenekleri eklendi.
- Müsaitliğim bölümüne bütçe seçeneği eklendi.
- Profilim bölümüne IBAN alanı eklendi.
- Üyeler bölümünde `+2 gün` gibi kısaltma kaldırıldı; girilen tüm müsait günler gösteriliyor.
- Aktivite tercihleri bölümüne yeni aktivite ekleme alanı eklendi.
- Ortak uygunluk kartlarına `Bildir` butonu eklendi. Demo modda bu buton gerçek push bildirimi göndermiyor; seçilen ortak aralıktaki kişilere bildirim gönderilmiş gibi ekranda onay mesajı gösteriyor.

## Gerçek bildirim için sonraki adım

Gerçek bildirim için Supabase üzerinde `notifications` tablosu açılıp uygulamaya giriş yapan kullanıcıların bildirimleri buradan okuması gerekir. Daha sonra PWA push notification eklenebilir.

## v4 notları

- Aktivite uyumu kartlarındaki yazı hizalaması düzeltildi.
- Her grup için bir yönetici mantığı eklendi. Demo veride grubu kuran kullanıcı yönetici kabul edilir.
- Üst barda yönetici etiketi ve seçili grubun yöneticisi gösterilir.
- Yeni Yönetim sekmesinden yönetici üyeleri gruptan atabilir. Yönetici kendisini atamaz.
- Supabase şemasına owner rolüyle üye silme politikası eklendi.

## v5 notu
- Üye kartına veya karttaki Kopyala butonuna tıklayınca üyenin IBAN bilgisi panoya kopyalanır.
- Profilim sekmesinde değiştirilen IBAN, kullanıcının üye kartına da yansır.

## v6 notu
- Sinema seçildiğinde Film tercihi alanı açılır.
- Konser seçildiğinde Sanatçı tercihi alanı açılır.
- Gezi seçildiğinde Yer tercihi alanı açılır.
- Bu alanlarda iki seçenek vardır: `Baya zenginim` veya `İlle benim dediğim ... olsun`.
- `İlle benim dediğim` seçilirse ilgili film/sanatçı/yer yazılabilir.
- Üye kartlarında ve Aktivite uyumu bölümünde bu detaylar gösterilir.


## Vercel yayını

Bu proje Vite tabanlı bir React uygulamasıdır ve Vercel'e deploy edilmeye hazırdır.

Önerilen Vercel ayarları:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

`vercel.json` dosyası eklendiği için sayfa yenileme / direkt link açma durumlarında uygulama `index.html` üzerinden çalışır.
v22 force deploy
