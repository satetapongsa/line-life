import type { Category, Product, ProductOption } from "./types";

/**
 * ข้อมูลเมนูสำหรับโหมดทดสอบ (ใช้ตอนยังไม่ได้ตั้งค่า Supabase)
 * ข้อมูลชุดเดียวกันนี้ถูก seed ลงฐานข้อมูลใน supabase/migrations
 */

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

export const demoCategories: Category[] = [
  { id: "cat-drink", name: "เครื่องดื่ม", slug: "drink", sort_order: 1 },
  { id: "cat-bakery", name: "เบเกอรี่", slug: "bakery", sort_order: 2 },
  { id: "cat-dessert", name: "ของหวาน", slug: "dessert", sort_order: 3 },
];

function sizeOptions(productId: string): ProductOption[] {
  return [
    ["S", 0],
    ["M", 10],
    ["L", 20],
  ].map(([label, delta], i) => ({
    id: `${productId}-size-${label}`,
    product_id: productId,
    group_name: "size",
    label: label as string,
    price_delta: delta as number,
    sort_order: i,
    is_default: i === 0,
  }));
}

function sweetOptions(productId: string): ProductOption[] {
  return ["0%", "25%", "50%", "100%"].map((label, i) => ({
    id: `${productId}-sweet-${i}`,
    product_id: productId,
    group_name: "sweetness",
    label,
    price_delta: 0,
    sort_order: i,
    is_default: label === "50%",
  }));
}

type Seed = Omit<Product, "options" | "is_available"> & {
  sizes?: boolean;
  sweet?: boolean;
};

const seeds: Seed[] = [
  {
    id: "p1",
    category_id: "cat-drink",
    name: "ชาไทยเย็น",
    description: "ชาไทยเข้มข้น หอมนม ชงสดทุกแก้ว",
    price: 45,
    image_url: img("1558857563-b371033873b8"),
    sort_order: 1,
    sizes: true,
    sweet: true,
  },
  {
    id: "p2",
    category_id: "cat-drink",
    name: "กาแฟลาเต้",
    description: "เอสเปรสโซ่คั่วกลาง ผสมนมสดนุ่มละมุน",
    price: 55,
    image_url: img("1541167760496-1628856ab772"),
    sort_order: 2,
    sizes: true,
    sweet: true,
  },
  {
    id: "p7",
    category_id: "cat-drink",
    name: "อเมริกาโน่เย็น",
    description: "กาแฟดำเย็น รสชาติเข้ม สดชื่น",
    price: 50,
    image_url: img("1461023058943-07fcbe16d735"),
    sort_order: 3,
    sizes: true,
    sweet: true,
  },
  {
    id: "p5",
    category_id: "cat-drink",
    name: "น้ำส้มคั้น",
    description: "ส้มคั้นสด 100% ไม่เติมน้ำตาล",
    price: 40,
    image_url: img("1600271886742-f049cd451bba"),
    sort_order: 4,
    sizes: true,
  },
  {
    id: "p3",
    category_id: "cat-bakery",
    name: "ขนมปังปิ้ง",
    description: "ขนมปังโฮมเมดปิ้งกรอบ เสิร์ฟพร้อมไข่ดาว",
    price: 35,
    image_url: img("1525351484163-7529414344d8"),
    sort_order: 1,
  },
  {
    id: "p4",
    category_id: "cat-bakery",
    name: "ครัวซองต์",
    description: "เนยฝรั่งเศสแท้ อบใหม่ทุกเช้า กรอบนอกนุ่มใน",
    price: 65,
    image_url: img("1555507036-ab1f4038808a"),
    sort_order: 2,
  },
  {
    id: "p6",
    category_id: "cat-dessert",
    name: "เค้กช็อกโกแลต",
    description: "เค้กช็อกโกแลตเข้มข้น ราดกานาชเยิ้มๆ",
    price: 85,
    image_url: img("1578985545062-69928b1d9587"),
    sort_order: 1,
  },
  {
    id: "p8",
    category_id: "cat-dessert",
    name: "บราวนี่ช็อกโกแลต",
    description: "บราวนี่หนึบหนับ ช็อกโกแลตเข้มเต็มคำ",
    price: 60,
    image_url: img("1606313564200-e75d5e30476c"),
    sort_order: 2,
  },
];

export const demoProducts: Product[] = seeds.map(({ sizes, sweet, ...p }) => ({
  ...p,
  is_available: true,
  options: [...(sizes ? sizeOptions(p.id) : []), ...(sweet ? sweetOptions(p.id) : [])],
}));
