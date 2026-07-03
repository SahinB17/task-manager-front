# Task Manager Frontend

Bu layihe muhasibat ve audit isleri ucun hazirlanmis task management sisteminin frontend hissesidir. Meqsed komanda daxilinde tapsiriqlari, musterileri, serhleri, fayllari ve emeliyyat tarixcesini daha rahat idare etmekdir.

Frontend React + Vite ile yazilib ve FastAPI backend-e API sorgulari gonderir. Sistem PostgreSQL database uzerinden melumatlari saxlayir.

## Teqdimat Ucun Qisa Izah

Task Manager sirket daxilinde is axinini izlemek ucun hazirlanmis sadə idareetme panelidir. Admin ve manager butun isleri, musterileri ve istifadecileri gore bilir. Employee ise ozune verilen tapsiriqlari gorur, statusunu deyisir, serh yazir ve fayl elave edir.

Layihenin esas fikri budur: kim ne is gorur, hansi is gecikir, hansi musteri ile baglidir ve is uzerinde hansi deyisiklikler olub.

## Stack

- React
- Vite
- Axios
- FastAPI backend
- PostgreSQL database

## Esas Funksiyalar

- Login sistemi
- JWT token ile API sorgulari
- Role-based access: admin, manager, employee
- Dashboard statistikasi
- Task yaratmaq, redakte etmek, status deyismek ve silmek
- Musteri siyahisi ve musteri idareetmesi
- Istifadeci siyahisi ve istifadeci idareetmesi
- Tasklara comment elave etmek
- Tasklara attachment/fayl yuklemek ve download etmek
- Activity logs, yeni emeliyyat tarixcesi

## Demo Axini

Teqdimat zamani bu ardicilliqla gostermek olar:

1. Login sehifesinden sisteme daxil olmaq.
2. Dashboard-da umumi tapsiriq sayini, gecikenleri ve status paylanmasini gostermek.
3. Yeni task yaratmaq ve ona musteri, icraci, prioritet ve son tarix vermek.
4. Task statusunu deyismek.
5. Task detallarinda comment yazmaq ve attachment yuklemek.
6. Manager/admin rolunda musteriler, istifadeciler ve activity logs sehifelerini gostermek.
7. Employee rolunda yalniz assigned tasklarin gorunduyunu gostermek.

## Role Qaydasi

Admin ve manager:

- Butun tasklari gore bilir
- Task, musteri ve istifadeci yarada/redakte ede bilir
- Activity logs sehifesini gore bilir

Employee:

- Ozune assigned olunan tasklari gore bilir
- Oz taskinin statusunu deyise bilir
- Oz tasklarina comment ve attachment elave ede bilir

## Qurasdirma

Layiheni localda isletmek ucun dependency-leri yukle:

```bash
npm install
```

Frontend-i development mode-da baslat:

```bash
npm run dev
```

Default olaraq frontend bu unvanda acilir:

```text
http://localhost:5173
```

## Environment Variables

Frontend backend API URL-ni `.env` faylindan oxuyur. Numune fayl:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Local backend `http://127.0.0.1:8000`-de isleyirse bu deyer kifayetdir.

Deploy zamani `VITE_API_URL` production backend domainine deyisdirilmelidir:

```env
VITE_API_URL=https://api.example.com
```

Qeyd: Vite env deyisikliklerini build vaxti oxuyur. Production URL deyisende yeniden build etmek lazimdir.
Production build/runtime ucun `VITE_API_URL` mutleq teyin olunmalidir; eks halda frontend localhost fallback istifade etmeyecek ve aydin error verecek.
Backend-de production frontend domaini `BACKEND_CORS_ORIGINS` siyahisina elave olunmalidir. Credentials aktiv oldugu ucun `*` origin istifade etmeyin.

## Build

Production build yaratmaq ucun:

```bash
npm run build
```

Build neticesi `dist/` qovlugunda yaranir.

Build-i local yoxlamaq ucun:

```bash
npm run preview
```

## Lint

Kod yoxlamasi ucun:

```bash
npm run lint
```

## Backend

Bu frontend FastAPI backend ile isleyir. Backend terefinde esas hisseler:

- JWT auth
- Users, roles
- Clients
- Tasks
- Comments
- Attachments
- Activity logs
- PostgreSQL database

Backend islemese frontend login ve data sorgularini ala bilmeyecek.

## API Elaqesi

API sorgulari `src/api.js` faylindaki Axios instance uzerinden gedir. Token varsa request header-e avtomatik elave olunur:

```text
Authorization: Bearer TOKEN
```

Token expire olsa ve backend `401` qaytarsa, frontend user-i login sehifesine qaytarir.

## Layihenin Statusu

Bu layihe tapsiriq ve portfolio meqsedi ile hazirlanmis, core funksiyalari tamamlanmis full-stack task management sistemidir. Sistem demo, prezentasiya ve portfolio ucun rahat sekilde istifade oluna biler.

Hazirda isleyen esas hisseler:

- Auth sistemi isleyir
- Role-based access sistemi isleyir
- Task CRUD tam isleyir
- Comment ve attachment sistemi isleyir
- Dashboard statistikasi ve activity logs var
- Frontend ve backend elaqesi stabil sekilde qurulub
- Token request-lere avtomatik elave olunur
- Token expire olanda user login sehifesine qaytarilir
- Admin, manager ve employee rollari ferqli davranir
- Empty ve loading hallar UI-da daha seliqeli gosterilir
- Deploy ucun `VITE_API_URL` env deyeri ayrilib

Bu layiheni "minimum versiya" kimi yox, esas biznes axinlarini qarshilayan tam islek demo sistem kimi teqdim etmek daha duzgundur.

Gelecekde elave oluna bilecek texniki tekmillesdirmeler:

- Frontend komponentlerinin daha kicik fayllara bolunmesi
- Backend ucun Alembic migration sistemi
- Daha genis test coverage
- Production deploy ucun daha etrafli monitoring ve backup 2321