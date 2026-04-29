import { api } from './apiClient';

/**
 * POST /payment/link — create payment link (Razorpay)
 * @param {Object} payload - { amount, currency, description, customer: { name, email, contact }, lead_id?, send_sms? }
 */
export async function createPaymentLink(payload) {
  const { data } = await api.post('/payment/link', payload);
  return data;
}

/**
 * GET /api/payment/status — by id or payment_link_id (query string).
 * Example: /api/payment/status?payment_link_id=plink_xxx
 * @param {Object} params - { id } or { payment_link_id }
 */
export async function getPaymentStatus(params) {
  const { data } = await api.get('/payment/status', { params });
  return data;
}

/**
 * Picks a status string from various backend / Razorpay-shaped JSON bodies.
 */
export function extractStatusFromPaymentStatusResponse(body) {
  if (body == null || typeof body !== 'object') return null;
  const inner =
    body.data != null && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : body;
  const s =
    inner.status ??
    inner.payment_status ??
    inner.state ??
    inner.payment_link?.status ??
    inner.payment?.status ??
    body.status;
  if (s == null || String(s).trim() === '') return null;
  return String(s).trim();
}

/**
 * For each row with a payment link id, calls GET /payment/status and merges `status` for the table.
 */
export async function enrichPaymentsWithLiveStatus(payments) {
  if (!Array.isArray(payments) || payments.length === 0) return payments;
  const rows = await Promise.all(
    payments.map(async (p) => {
      const linkId = p.payment_link_id ?? p.razorpay_payment_link_id ?? p.paymentLinkId;
      if (!linkId) return p;
      try {
        const body = await getPaymentStatus({ payment_link_id: linkId });
        const st = extractStatusFromPaymentStatusResponse(body);
        if (st) return { ...p, status: st };
      } catch {
        /* keep list payload status */
      }
      return p;
    }),
  );
  return rows;
}

/**
 * GET /api/payments — list with pagination (query string).
 * Example: /api/payments?page=1&limit=10&status=completed
 * @param {Object} params - { page, limit, status?, lead_id?, from_date?, to_date? }
 */
export async function getPayments(params = {}) {
  const { data } = await api.get('/payments', { params });
  return data;
}

/**
 * GET /api/payments/admin — admin-scoped list (query string).
 * Example: /api/payments/admin?page=1&limit=10&user_id=5&status=pending
 * @param {Object} params - { page, limit, status?, user_id?, lead_id?, from_date?, to_date? }
 */
export async function getAdminPayments(params = {}) {
  const { data } = await api.get('/payments/admin', { params });
  return data;
}
