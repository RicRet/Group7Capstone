import { getClient } from './redisClient.js';


function nowMs() { return Date.now(); }
function randn(mean, sd) {
// Box–Muller
const u = 1 - Math.random();
const v = 1 - Math.random();
return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


(async () => {
const client = await getClient();


setInterval(async () => {
const t = nowMs();


// requests per second (0–50 with spikes)
const req = Math.max(0, Math.round(randn(20, 10)));


// latency mean ~120ms with noise; clamp to [10, 1000]
const latency = Math.min(1000, Math.max(10, Math.round(randn(120, 40))));


// errors proportional to load with a little randomness
const errors = Math.max(0, Math.round(req * 0.02 + randn(0, 1)));


try {
await Promise.all([
client.ts.add('ts:req:count', t, req),
client.ts.add('ts:latency:ms', t, latency),
client.ts.add('ts:errors:count', t, errors)
]);
process.stdout.write(`t=${t} req=${req} latency=${latency}ms errors=${errors}\r`);
} catch (e) {
console.error('TS.ADD error:', e.message);
}
}, 1000);
})();