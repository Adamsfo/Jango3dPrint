const WHATSAPP_NUMBER = "5565992477468";

export const buildWhatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const whatsappBaseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
