import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run spike-test.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '10s', target: 500 }, // Ramps up quickly to 500 users in 10s (the spike)
    { duration: '30s', target: 500 }, // Stays at 500 users for 30s (the stampede)
    { duration: '10s', target: 0 },   // Ramps down
  ],
};

export default function () {
  const res = http.get(`${BASE_URL}/api/events`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Short sleep to simulate brutal refreshing speed
  sleep(0.5);
}
