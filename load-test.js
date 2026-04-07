import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run load-test.js
// You can override the base URL when running via CLI:
// k6 run -e BASE_URL=https://evestro.vercel.app load-test.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30s
    { duration: '1m', target: 50 },  // Hold at 50 users for 1 min
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be < 1%
  },
};

export default function () {
  // Test the events listing endpoint (typical user behavior)
  const res = http.get(`${BASE_URL}/api/events`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'events returned': (r) => {
        try {
            const body = JSON.parse(r.body);
            return body.success === true;
        } catch {
            return false;
        }
    }
  });

  // Short sleep to simulate real user wait time between actions
  sleep(1);
}
