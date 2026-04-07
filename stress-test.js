import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run stress-test.js
// You can override the base URL when running via CLI:
// k6 run -e BASE_URL=https://evestro.vercel.app stress-test.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Traffic starts building
    { duration: '1m', target: 200 },  // Steep ramp to 200 users (stress)
    { duration: '1m', target: 200 },  // Hold at stress level
    { duration: '30s', target: 0 },   // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Expecting slower responses under high stress, but should be < 2s
    http_req_failed: ['rate<0.05'],    // Accepting up to 5% failures during peak stress
  },
};

export default function () {
  // Test the events listing endpoint as it queries the database
  const res = http.get(`${BASE_URL}/api/events`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Short sleep to simulate real user wait time between actions
  sleep(1);
}
