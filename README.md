# Wave Shop — ร้านเครื่องดื่มและเบเกอรี่บน LINE LIFF

เว็บแอปสั่งเครื่องดื่ม/เบเกอรี่ล่วงหน้าที่เปิดในแอป LINE (และเปิดใน Chrome ได้) ลูกค้าเลือกเมนูพร้อมตัวเลือก ใส่ตะกร้า เลือกเวลามารับ ชำระด้วย QR พร้อมเพย์ และติดตามสถานะออเดอร์ที่อัปเดตอัตโนมัติ ส่วนเจ้าของร้านมีหน้าหลังร้านสำหรับดูยอดขาย จัดการออเดอร์ และจัดการสินค้า

- Production: https://line-life-eta.vercel.app
- LIFF URL: https://liff.line.me/2012656651-Pliqsgc0

## ฟีเจอร์

**ลูกค้า**
- Login ด้วย LINE อัตโนมัติผ่าน LIFF แสดงชื่อ/รูปโปรไฟล์
- เมนูแยกหมวดหมู่ (เครื่องดื่ม / เบเกอรี่ / ของหวาน) ค้นหาได้ มี skeleton ตอนโหลด
- เลือกขนาด S/M/L, ความหวาน 0–100%, ใส่หมายเหตุ, เลือกจำนวน ผ่าน bottom sheet
- ตะกร้าแก้จำนวน/ลบได้ จำค่าไว้ใน localStorage
- Checkout เลือกเวลามารับ (ทุก 15 นาที ภายในเวลาเปิดร้าน 08:00–20:00)
- QR พร้อมเพย์ตามยอดเงิน + ปุ่ม "แจ้งชำระเงิน" (เดโม ไม่ตรวจสลิปจริง)
- ส่ง Flex Message สรุปออเดอร์เข้าแชทหลังสั่งซื้อ (เฉพาะตอนเปิดในแอป LINE)
- `/orders` ประวัติการสั่งซื้อ, `/orders/[id]` timeline สถานะ อัปเดตอัตโนมัติทุก 5 วินาที

**แอดมิน (`/admin`)**
- ภาพรวม: ยอดขายวันนี้, จำนวนออเดอร์, ออเดอร์รอยืนยันชำระ, เมนูขายดี 7 วัน
- บอร์ดออเดอร์ กรองตามสถานะ กดเปลี่ยนสถานะตามลำดับ `pending → paid → preparing → ready → completed` หรือ `cancelled`
- จัดการสินค้า: เพิ่ม/แก้ไข/เปิด-ปิดการขาย อัปโหลดรูปขึ้น Supabase Storage

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · `@line/liff` · Supabase (Postgres + Storage) · `promptpay-qr` + `qrcode` · Deploy บน Vercel

## ความปลอดภัย (สิ่งที่ออกแบบไว้)

| ประเด็น | วิธีที่ใช้ |
| --- | --- |
| ปลอมตัวเป็นคนอื่น | ทุก API ที่เกี่ยวกับผู้ใช้รับ `liff.getIDToken()` ใน header `Authorization: Bearer` แล้ว server verify กับ `https://api.line.me/oauth2/v2.1/verify` (เช็ค `aud` = Channel ID, `iss`, `exp`) และใช้ `sub` เป็น userId — ไม่เชื่อ userId/ชื่อที่ client ส่งมา |
| แก้ราคาเอง | client ส่งแค่ id สินค้า/ตัวเลือก/จำนวน server คำนวณราคาใหม่จากฐานข้อมูลทั้งหมด และตรวจว่าตัวเลือกเป็นของสินค้านั้นจริง |
| เขียนฐานข้อมูลตรงจาก client | เปิด RLS ทุกตาราง เมนูอ่านได้อย่างเดียว ตาราง `orders`/`order_items` ไม่มี policy ให้ client เลย ต้องผ่าน API route ที่ใช้ service role |
| Service role key หลุด | อยู่ใน `SUPABASE_SERVICE_ROLE_KEY` (ไม่มี `NEXT_PUBLIC_`) และไฟล์ `lib/supabase/server.ts` มี `import "server-only"` กัน import จากฝั่ง client |
| ดูออเดอร์คนอื่น | query ทุกครั้งกรองด้วย `line_user_id` ของผู้ใช้ที่ verify แล้ว ตอบ 404 เหมือนกันทั้งกรณีไม่มี/ไม่ใช่เจ้าของ |
| ลูกค้ากดว่าจ่ายแล้วเอง | ลูกค้าเปลี่ยนได้แค่ `payment_status = reported` ร้านเป็นคนยืนยันเป็น `paid` |
| แอดมิน | verify token + เช็ค `ADMIN_LINE_USER_IDS` ฝั่ง server ทุก request, เปลี่ยนสถานะได้ตามลำดับที่กำหนดพร้อม optimistic lock |
| อัปโหลดไฟล์อันตราย | ตรวจชนิดไฟล์จาก magic bytes (JPG/PNG/WEBP) จำกัดขนาด ตั้งชื่อไฟล์ใหม่เอง bucket อนุญาตเฉพาะ mime รูป |
| สแปมออเดอร์ | จำกัดออเดอร์ค้างชำระต่อคน 5 รายการ, จำกัดจำนวนชิ้น/รายการต่อออเดอร์ |
| ออเดอร์ครึ่งๆ กลางๆ | สร้าง order + items ใน Postgres function เดียว (transaction) และ revoke สิทธิ์ execute จาก anon |

## โครงสร้างโปรเจค

```
app/
  page.tsx                    หน้าร้าน
  checkout/                   ยืนยันคำสั่งซื้อ
  orders/ , orders/[id]/      ประวัติ / สถานะออเดอร์
  admin/                      หลังร้าน
  api/orders/...              API ฝั่งลูกค้า (สร้างออเดอร์, ดูออเดอร์, แจ้งชำระ, ยกเลิก)
  api/admin/...               API แอดมิน (dashboard, orders, products, upload)
components/                   UI แยกเป็นชิ้น (shop/, checkout/, orders/, admin/)
hooks/                        useLiff, useCart, useProducts, useApi
lib/
  line/verify.ts              verify LINE ID token
  supabase/server.ts          client ฝั่ง server (service role)
  supabase/client.ts          client ฝั่ง browser (anon key)
  orders/pricing.ts           ตรวจข้อมูล + คำนวณราคาใหม่
  promptpay.ts, flex.ts       QR พร้อมเพย์ / Flex Message
supabase/migrations/          SQL schema, RLS, storage, seed, create_order
```

---

## วิธีตั้งค่า

### 1. Supabase

1. สร้างโปรเจคที่ https://supabase.com (Region แนะนำ Singapore)
2. รัน migration ตามลำดับชื่อไฟล์ใน `supabase/migrations/` เลือกได้ 2 วิธี
   - **SQL Editor (ง่ายสุด):** เปิด SQL Editor → New query → คัดลอกเนื้อหาไฟล์ทีละไฟล์ตามลำดับ `…0001_schema` → `…0002_rls` → `…0003_storage` → `…0004_seed` → `…0005_create_order` → `…0006_more_menu` แล้วกด Run
   - **Supabase CLI:**
     ```bash
     npx supabase login
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```
3. ตรวจที่ Table Editor ว่ามีสินค้า 19 รายการ (เครื่องดื่ม 7 / เบเกอรี่ 6 / ของหวาน 6) และที่ Storage มี bucket `product-images` (public)
4. ไปที่ **Project Settings → API** คัดลอก
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (ห้ามเผยแพร่)

### 2. LINE Developers

1. เข้า https://developers.line.biz/console/ → Provider `Wave Dev` → channel LINE Login `Wave Dev`
2. **หา Channel ID:** แท็บ **Basic settings** → ช่อง `Channel ID` (ตัวเลข 10 หลัก) → ใส่ใน `LINE_LOGIN_CHANNEL_ID`
   - ต้องเป็น channel เดียวกับที่สร้าง LIFF app ไม่อย่างนั้น verify token จะไม่ผ่าน (aud ไม่ตรง)
3. แท็บ **LIFF** → แก้ LIFF app
   - Endpoint URL: `https://line-life-eta.vercel.app`
   - Size: Full, Scopes: `openid`, `profile`, `chat_message.write`
   - LIFF ID → `NEXT_PUBLIC_LIFF_ID`
4. ถ้าอยากให้ Flex Message ส่งได้ ต้องเปิด LIFF จาก **ห้องแชท** (เช่น ส่งลิงก์ LIFF ในแชทแล้วกด) ถ้าเปิดจากที่อื่นระบบจะข้ามขั้นตอนนี้ให้เองโดยไม่ทำให้การสั่งซื้อพัง

### 3. Vercel

ไปที่ Project → **Settings → Environment Variables** ใส่ครบทุกตัวตาม `.env.example` (เลือก Production + Preview)

| ตัวแปร | ตัวอย่าง |
| --- | --- |
| `NEXT_PUBLIC_LIFF_ID` | `2012656651-Pliqsgc0` |
| `LINE_LOGIN_CHANNEL_ID` | `2012656651` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (secret) |
| `PROMPTPAY_ID` | `0812345678` |
| `ADMIN_LINE_USER_IDS` | `U1234...,U5678...` |

แล้วกด **Redeploy** (ตัวแปร `NEXT_PUBLIC_*` ถูกฝังตอน build ต้อง deploy ใหม่ทุกครั้งที่แก้)

### 4. หา LINE userId ของตัวเองเพื่อเป็นแอดมิน

วิธีที่ 1 (แนะนำ): เปิด `https://liff.line.me/2012656651-Pliqsgc0/admin` ในแอป LINE → หน้าจะแจ้งว่าไม่มีสิทธิ์และแสดง userId ของคุณ (ขึ้นต้นด้วย `U`) → กด "คัดลอก userId" → ใส่ใน `ADMIN_LINE_USER_IDS` → Redeploy

วิธีที่ 2: LINE Developers Console → channel → แท็บ **Basic settings** → เลื่อนลงหา **Your user ID**

> userId ของ LINE แตกต่างกันตาม Provider ต้องใช้ค่าที่ได้จาก Provider `Wave Dev` เท่านั้น

### 5. โลโก้

วางไฟล์ `public/logo.png` (สี่เหลี่ยมจัตุรัส แนะนำ 512×512) ถ้ายังไม่มีไฟล์ หน้าเว็บจะแสดงไอคอนแก้วแทน

### 6. เชื่อมเข้า LINE แชท

LIFF คือหน้าเว็บที่ "เปิดในแอป LINE" ลูกค้าจะเข้าร้านได้ต้องมีทางเข้าจากในแชท วิธีที่ใช้จริงคือผูกกับ **LINE Official Account (OA)** ของร้าน (สร้างฟรีที่ https://manager.line.biz) แล้วทำ Rich Menu ให้กดเข้าร้านได้เลย

**ขั้นที่ 1: ผูก OA กับ LINE Login channel**
1. LINE Developers Console → channel LINE Login `Wave Dev` → แท็บ **Basic settings** → หัวข้อ **Linked LINE Official Account** → Edit → เลือก OA ของร้าน
2. แท็บ **LIFF** → แก้ LIFF app → **Add friend option** เลือก `On (normal)` ลูกค้าที่เปิดร้านครั้งแรกจะมีตัวเลือกให้เพิ่มเพื่อน OA

**ขั้นที่ 2: ทำ Rich Menu (ปุ่มเมนูด้านล่างแชท)**
1. เปิด https://manager.line.biz → เลือก OA → **Rich menus** → สร้างเมนูใหม่ → อัปโหลดรูป (ขนาด 2500×843 หรือ 2500×1686 px) แล้วแบ่งช่องกดได้
2. ตั้งแต่ละช่องเป็น Action ชนิด **Link** (URI)
   - สั่งเครื่องดื่ม: `https://liff.line.me/2012656651-Pliqsgc0`
   - ออเดอร์ของฉัน: `https://liff.line.me/2012656651-Pliqsgc0/orders`
3. บันทึกและตั้งเป็นเมนูที่แสดง (Display) ลูกค้ากดจากแชทกับ OA แล้วร้านจะเปิดในแอปทันที

**ทางลัดอื่น (ไม่ต้องทำรูป):** ตั้ง **ข้อความต้อนรับ** (Greeting message) หรือ **ตอบกลับอัตโนมัติ** ใน OA Manager ให้ส่งลิงก์ `https://liff.line.me/2012656651-Pliqsgc0` หรือพิมพ์ลิงก์ในแชทแล้วกด

**ข้อควรรู้เรื่อง Flex Message ในแชท**
- `liff.sendMessages` ส่งได้เฉพาะตอนที่ LIFF **ถูกเปิดจากห้องแชท** (แชทกับ OA, กลุ่ม หรือห้อง) เช่น เปิดจาก Rich Menu หรือกดลิงก์ในแชท ถ้าเปิดจากทางอื่น เช่น ลิงก์ในเบราว์เซอร์ ระบบจะข้ามขั้นตอนนี้ให้เอง ไม่ทำให้การสั่งซื้อพัง
- ข้อความจะถูกส่งในนามของลูกค้าเอง (ไม่ใช่บอทของร้าน) ปุ่มใน Flex เปิดหน้าออเดอร์ผ่าน LIFF URL
- ต้องเปิด scope `chat_message.write` ใน LIFF app (เปิดไว้แล้ว) และ channel ต้องเป็นสถานะ Published
- ยังไม่มีการ push แจ้งเตือนอัตโนมัติเมื่อสถานะเปลี่ยน ลูกค้าดูได้ที่หน้า `/orders/[id]` ถ้าต้องการแจ้งเตือนเข้าแชท ต้องสร้าง Messaging API channel เพิ่มและใช้ channel access token ฝั่ง server

---

## รันบนเครื่อง

```bash
npm install
cp .env.example .env.local   # แล้วกรอกค่า
npm run dev
```

เปิด http://localhost:3000

- **ยังไม่ใส่ `NEXT_PUBLIC_LIFF_ID`** → โหมดทดสอบ ใช้ผู้ใช้จำลอง (ฝั่ง server ยอมรับ token จำลองเฉพาะตอน `npm run dev` และไม่ได้ตั้ง `LINE_LOGIN_CHANNEL_ID` เท่านั้น production ไม่มีทางผ่าน)
- **ยังไม่ใส่ Supabase** → แสดงเมนูตัวอย่าง แต่สั่งซื้อจริงไม่ได้
- ทดสอบ LIFF จริงบนเครื่อง: ใช้ tunnel เช่น `ngrok http 3000` แล้วตั้ง Endpoint URL ของ LIFF ชั่วคราวเป็น URL ของ ngrok

## Flow สถานะออเดอร์

```
pending (รอชำระ) ──ลูกค้ากด "แจ้งชำระเงิน"──▶ payment_status = reported
   │                                              │
   │ ร้านกด "ยืนยันได้รับเงินแล้ว" ◀──────────────────┘
   ▼
paid ──▶ preparing ──▶ ready ──▶ completed
  (ยกเลิกได้ทุกขั้นก่อน completed / ลูกค้ายกเลิกเองได้ตอนยังไม่แจ้งชำระ)
```
