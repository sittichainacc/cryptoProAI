# คู่มือการ Deploy ระบบ CryptoPro AI ขึ้น Vercel (Production)

เอกสารนี้อธิบายขั้นตอนการ Deploy ระบบ **CryptoPro AI & US Stocks Trading Terminal** ขึ้นสู่ **Vercel** ทั้งผ่าน **GitHub Integration (แนะนำ)** และผ่าน **Vercel CLI**

---

## 🏗️ สถาปัตยกรรมการทำงานบน Vercel

```mermaid
flowchart TD
    User["🌐 ผู้ใช้งาน (Browser)"]
    
    subgraph Vercel ["▲ Vercel Cloud Platform"]
        EdgeCDN["⚡ Vercel Edge CDN (Static Assets: HTML/CSS/JS)"]
        Serverless["⚙️ Vercel Serverless Function (api/index.js)"]
        Rewrites["🔀 vercel.json Rewrites Engine"]
    end
    
    subgraph External ["☁️ Cloud Services"]
        Supabase["🐘 Supabase PostgreSQL (IPv4 Pooler :5432)"]
        Yahoo["📈 Yahoo Finance & Macro API"]
        Bitkub["🪙 Bitkub / Binance Public API"]
    end
    
    User -->|เข้าชมหน้าเว็บ /stocks, /portfolio| Rewrites
    Rewrites -->|Static Files / SPA Routes| EdgeCDN
    Rewrites -->|เรียกข้อมูล /api/*| Serverless
    Serverless --> Supabase
    Serverless --> Yahoo
    Serverless --> Bitkub
```

- **Frontend**: โค้ด React + Vite ใน `client/dist` ถูกเสิร์ฟผ่าน Global Edge Network ของ Vercel ความเร็วสูงทั่วโลก
- **Backend API**: เส้นทาง `/api/*` และ `/health` ถูกแมปเข้าหา Serverless Function ใน `api/index.js`
- **Database**: เชื่อมต่อโดยตรงกับ Supabase PostgreSQL Transaction Pooler บนพอร์ต 5432

---

## 🔑 Environment Variables ที่ต้องตั้งค่าใน Vercel

ก่อนทำการ Deploy ให้ไปที่ **Project Settings > Environment Variables** ใน Vercel Dashboard และเพิ่มตัวแปรต่อไปนี้:

| Variable Name | Value | หมายเหตุ |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | โหมดการทำงานโปรดักชัน |
| `DATABASE_URL` | `postgresql://postgres.sfotlpjydhdpcmkooqwr:vhV2AHJp%23k%23g27%25@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require` | Supabase IPv4 Pooler Connection String |
| `DB_HOST` | `aws-0-ap-northeast-2.pooler.supabase.com` | Supabase Pooler Host |
| `DB_PORT` | `5432` | PostgreSQL Port |
| `DB_NAME` | `postgres` | ชื่อฐานข้อมูล |
| `DB_USER` | `postgres.sfotlpjydhdpcmkooqwr` | User บัญชี Supabase |
| `DB_PASSWORD` | `vhV2AHJp#k#g27%` | รหัสผ่านฐานข้อมูล |
| `SUPABASE_URL` | `https://sfotlpjydhdpcmkooqwr.supabase.co` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | `sb_publishable_Q6UfnNVpNr3LMr-83D9XeQ_kFlIkUFA` | Supabase Publishable / Anon Key |

---

## 🚀 วิธีที่ 1: Deploy ผ่าน GitHub (วิธีมาตรฐาน แนะนำสูงสุด ⭐)

เนื่องจากโค้ดทั้งหมดถูกซิงค์ขึ้น GitHub repository `https://github.com/sittichainacc/cryptoProAI` แล้ว:

1. เข้าสู่ระบบที่ [https://vercel.com](https://vercel.com)
2. คลิกปุ่ม **"Add New..."** -> **"Project"**
3. เลือก Repository: `sittichainacc/cryptoProAI`
4. ในหน้า **Configure Project**:
   - **Framework Preset**: Vercel จะตรวจจับการตั้งค่าจาก `vercel.json` โดยอัตโนมัติ
   - **Build and Output Settings**: ใช้ค่าเริ่มต้นตาม `vercel.json` (Build: `npm run build`, Output: `client/dist`)
   - **Environment Variables**: กรอกค่า Environment Variables ตามตารางด้านบน
5. คลิก **Deploy**
6. เมื่อสร้างเสร็จสิ้น Vercel จะมอบ Production Domain (เช่น `https://cryptopro-ai.vercel.app`) สามารถเข้าใช้งานได้ทันที 24/7!

---

## 💻 วิธีที่ 2: Deploy ผ่าน Vercel CLI จากเครื่องคอมพิวเตอร์

หากต้องการ Deploy จาก Command Line โดยตรง:

1. ล็อกอินเข้าสู่ระบบ Vercel:
   ```bash
   npx vercel login
   ```
2. ดำเนินการ Deploy ขึ้น Production:
   ```bash
   npx vercel --prod
   ```
   หรือดับเบิลคลิกไฟล์ `deploy-vercel.bat` ที่เตรียมไว้ในโฟลเดอร์โปรเจกต์
3. ปฏิบัติตามขั้นตอนที่ Vercel CLI แนะนำบนหน้าจอ
4. เมื่อเสร็จสิ้น Vercel จะแสดง URL ของระบบบน Terminal

---

## 🛠️ ไฟล์คอนฟิกที่เกี่ยวข้องในระบบ
- [vercel.json](file:///d:/Claude_Cowork/12.%20%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%20%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%20%E0%B8%84%E0%B8%A3%E0%B8%B4%E0%B8%9B%E0%B9%82%E0%B8%95/vercel.json): กำหนดการ Routing, Build Commands และ Rewrites
- [.vercelignore](file:///d:/Claude_Cowork/12.%20%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%20%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%20%E0%B8%84%E0%B8%A3%E0%B8%B4%E0%B8%9B%E0%B9%82%E0%B8%95/.vercelignore): ยกเว้นไฟล์ Docker และไฟล์ทดสอบที่ไม่จำเป็น
- [api/index.js](file:///d:/Claude_Cowork/12.%20%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%20%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%20%E0%B8%84%E0%B8%A3%E0%B8%B4%E0%B8%9B%E0%B9%82%E0%B8%95/api/index.js): Vercel Serverless Function entry point
- [deploy-vercel.bat](file:///d:/Claude_Cowork/12.%20%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%20%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%20%E0%B8%84%E0%B8%A3%E0%B8%B4%E0%B8%9B%E0%B9%82%E0%B8%95/deploy-vercel.bat): สคริปต์ช่วย Deploy อัตโนมัติบน Windows
