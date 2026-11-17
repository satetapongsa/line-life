import type { Product, ProductOption } from "./types";

/** select string ที่ใช้ดึงสินค้าพร้อมตัวเลือก (ใช้ร่วมกันทั้ง client และ server) */
export const PRODUCT_SELECT =
  "id, category_id, name, description, price, image_url, is_available, sort_order, product_options(id, product_id, group_name, label, price_delta, sort_order, is_default)";

type ProductRow = Omit<Product, "options" | "price"> & {
  price: number | string;
  product_options: (Omit<ProductOption, "price_delta"> & { price_delta: number | string })[] | null;
};

export function mapProductRow(row: ProductRow): Product {
  const { product_options, ...rest } = row;
  return {
    ...rest,
    price: Number(row.price),
    options: (product_options ?? [])
      .map((o) => ({ ...o, price_delta: Number(o.price_delta) }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}
