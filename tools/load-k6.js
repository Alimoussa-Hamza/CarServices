/**
 * Charge k6 — CS-M15-S06
 *
 * Scénario : health + catalog + quote + zones/check · ~50 RPS / 1 min.
 * Seuils p95 (warn, non bloquant CI MVP) : catalog < 200 ms, quote < 300 ms.
 *
 * Prérequis : API démarrée + seed (offre wash Lyon).
 *
 *   k6 run tools/load-k6.js
 *   API_URL=http://localhost:3000/api/v1 k6 run tools/load-k6.js
 *
 * Exit 0 même hors seuil (seuils en `thresholds` avec abortOnFail: false).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL || 'http://localhost:3000/api/v1';

export const options = {
  scenarios: {
    steady_50rps: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 80,
    },
  },
  thresholds: {
    'http_req_duration{name:catalog}': [
      { threshold: 'p(95)<200', abortOnFail: false },
    ],
    'http_req_duration{name:quote}': [
      { threshold: 'p(95)<300', abortOnFail: false },
    ],
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function setup() {
  const offersRes = http.get(`${API}/catalog/offers?zone=lyon`);
  let offerId = null;
  try {
    const body = offersRes.json();
    const offers = body?.data ?? [];
    offerId = offers[0]?.id ?? null;
  } catch {
    offerId = null;
  }
  return { offerId };
}

export default function (data) {
  const routes = ['health', 'catalog', 'quote', 'zones'];
  const route = pick(routes);

  if (route === 'health') {
    const res = http.get(`${API}/health`, { tags: { name: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  } else if (route === 'catalog') {
    const res = http.get(`${API}/catalog/offers?zone=lyon`, {
      tags: { name: 'catalog' },
    });
    check(res, { 'catalog 200': (r) => r.status === 200 });
  } else if (route === 'quote') {
    if (!data.offerId) {
      sleep(0.01);
      return;
    }
    const res = http.post(
      `${API}/catalog/quote`,
      JSON.stringify({
        offerId: data.offerId,
        vehicleType: 'berline',
        dirtLevel: 'normal',
        optionIds: [],
        zoneSlug: 'lyon',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'quote' },
      },
    );
    check(res, { 'quote 200': (r) => r.status === 200 });
  } else {
    const res = http.post(
      `${API}/zones/check`,
      JSON.stringify({ lat: 45.764, lng: 4.8357, postalCode: '69002' }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'zones' },
      },
    );
    check(res, { 'zones 200': (r) => r.status === 200 });
  }

  sleep(0.01);
}
