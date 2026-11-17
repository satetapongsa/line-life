import { BreadIcon, CakeIcon, CupIcon, GridIcon } from "./Icons";

/** ไอคอนประจำหมวดหมู่ (อิงจาก slug) */
export function CategoryIcon({ slug, size = 18 }: { slug: string; size?: number }) {
  switch (slug) {
    case "drink":
      return <CupIcon size={size} />;
    case "bakery":
      return <BreadIcon size={size} />;
    case "dessert":
      return <CakeIcon size={size} />;
    default:
      return <GridIcon size={size} />;
  }
}
