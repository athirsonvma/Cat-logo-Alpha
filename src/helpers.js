export function formatPrice(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function generateCode(existingCodes) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (existingCodes.includes(code));
  return code;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function daysSince(timestamp) {
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
}

export function daysOnMarket(createdAt) {
  return daysSince(createdAt) || 0;
}

// Guarda só os dígitos — evita que "(84) 99999-9999" e "84999999999"
// sejam tratados como telefones diferentes na hora de checar duplicidade.
export function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function formatPhoneDisplay(phone) {
  const digits = normalizePhone(phone);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone || '';
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
