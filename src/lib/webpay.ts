import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk';

// En INTEGRACION se usan las credenciales de prueba públicas de Transbank (gratuitas).
// En PRODUCCION se requieren credenciales reales, entregadas al afiliarse.
function getTransaction() {
  const isProd = process.env.TRANSBANK_ENVIRONMENT === 'PRODUCCION';

  const options = isProd
    ? new Options(
        process.env.TRANSBANK_COMMERCE_CODE!,
        process.env.TRANSBANK_API_KEY!,
        Environment.Production,
      )
    : new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration,
      );

  return new WebpayPlus.Transaction(options);
}

// Reintentos con backoff exponencial simple para llamadas a la API de Transbank.
async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 300): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export async function createWebpayTransaction(params: {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
}) {
  const tx = getTransaction();
  return withRetry(() => tx.create(params.buyOrder, params.sessionId, params.amount, params.returnUrl));
}

export async function commitWebpayTransaction(token: string) {
  const tx = getTransaction();
  return withRetry(() => tx.commit(token));
}

export async function statusWebpayTransaction(token: string) {
  const tx = getTransaction();
  return withRetry(() => tx.status(token));
}
