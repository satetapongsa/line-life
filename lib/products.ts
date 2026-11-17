export type Product = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  bg: string;
};

export const products: Product[] = [
  { id: "p1", name: "ชาไทยเย็น", price: 45, emoji: "🧋", bg: "bg-orange-100" },
  { id: "p2", name: "กาแฟลาเต้", price: 55, emoji: "☕", bg: "bg-amber-100" },
  { id: "p3", name: "ขนมปังปิ้ง", price: 35, emoji: "🍞", bg: "bg-yellow-100" },
  { id: "p4", name: "ครัวซองต์", price: 65, emoji: "🥐", bg: "bg-rose-100" },
  { id: "p5", name: "น้ำส้มคั้น", price: 40, emoji: "🍊", bg: "bg-lime-100" },
  { id: "p6", name: "เค้กช็อกโกแลต", price: 85, emoji: "🍰", bg: "bg-pink-100" },
];
