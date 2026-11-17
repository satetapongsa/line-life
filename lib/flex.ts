import type { LiffMessages } from "@/hooks/useLiff";
import { formatBaht, formatDateTime, formatOrderNo, optionSummary } from "./format";
import { SHOP_NAME } from "./shop";
import type { Order } from "./types";

const BRAND = "#06C755";

/** ลิงก์เปิดหน้าออเดอร์ (ผ่าน LIFF URL ถ้ามี จะได้เปิดในแอป LINE พร้อม login) */
export function orderUrl(orderId: string) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  return liffId
    ? `https://liff.line.me/${liffId}/orders/${orderId}`
    : `${window.location.origin}/orders/${orderId}`;
}

/** Flex Message สรุปออเดอร์ สำหรับส่งเข้าแชทด้วย liff.sendMessages */
export function buildOrderFlex(order: Order): LiffMessages {
  const itemRows = order.items.slice(0, 10).map((item) => ({
    type: "box" as const,
    layout: "horizontal" as const,
    spacing: "sm",
    contents: [
      {
        type: "box" as const,
        layout: "vertical" as const,
        flex: 5,
        contents: [
          { type: "text" as const, text: `${item.product_name} x${item.quantity}`, size: "sm", wrap: true, color: "#111111" },
          ...(item.options.length
            ? [{ type: "text" as const, text: optionSummary(item.options), size: "xs", color: "#888888", wrap: true }]
            : []),
        ],
      },
      { type: "text" as const, text: formatBaht(item.line_total), size: "sm", align: "end" as const, flex: 2, color: "#111111" },
    ],
  }));

  return [
    {
      type: "flex",
      altText: `ออเดอร์ ${formatOrderNo(order.order_no)} ยอด ${formatBaht(order.total)}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: BRAND,
          paddingAll: "16px",
          contents: [
            { type: "text", text: SHOP_NAME, color: "#FFFFFF", size: "xs", weight: "bold" },
            { type: "text", text: "สั่งซื้อสำเร็จ", color: "#FFFFFF", size: "xl", weight: "bold", margin: "sm" },
            { type: "text", text: `ออเดอร์ ${formatOrderNo(order.order_no)}`, color: "#E8F9EF", size: "sm" },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            ...itemRows,
            ...(order.items.length > 10
              ? [{ type: "text" as const, text: `และอีก ${order.items.length - 10} รายการ`, size: "xs", color: "#888888" }]
              : []),
            { type: "separator", margin: "md" },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                { type: "text", text: "ยอดรวม", size: "md", weight: "bold" },
                { type: "text", text: formatBaht(order.total), size: "lg", weight: "bold", align: "end", color: BRAND },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "เวลามารับ", size: "sm", color: "#888888" },
                { type: "text", text: formatDateTime(order.pickup_time), size: "sm", align: "end" },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: BRAND,
              action: { type: "uri", label: "ชำระเงิน / ดูสถานะ", uri: orderUrl(order.id) },
            },
          ],
        },
      },
    },
  ];
}
