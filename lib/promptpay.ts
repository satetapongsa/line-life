import "server-only";

import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

function promptPayId(): string | null {
  const raw = (process.env.PROMPTPAY_ID ?? "").replace(/[^0-9]/g, "");
  // เบอร์มือถือ 10 หลัก / เลขบัตรประชาชน-นิติบุคคล 13 หลัก / e-Wallet 15 หลัก
  return [10, 13, 15].includes(raw.length) ? raw : null;
}

function maskId(id: string): string {
  if (id.length === 10) return `${id.slice(0, 3)}-xxx-${id.slice(6)}`;
  return `${"x".repeat(id.length - 4)}${id.slice(-4)}`;
}

/** สร้าง QR พร้อมเพย์ตามยอดเงิน คืนค่าเป็น data URL (PNG) */
export async function createPromptPayQr(amount: number) {
  const id = promptPayId();
  if (!id) return null;
  const payload = generatePayload(id, { amount });
  const dataUrl = await QRCode.toDataURL(payload, { width: 480, margin: 1, errorCorrectionLevel: "M" });
  return { dataUrl, maskedId: maskId(id), amount };
}
