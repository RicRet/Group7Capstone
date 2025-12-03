#!/usr/bin/env node

const base = process.env.API_BASE || 'http://localhost:8080';

async function run() {
  const username = `user_${Math.random().toString(36).slice(2,8)}`;
  const email = `${username}@example.com`;
  const password = 'pass1234';

  console.log('Signup...');
  let res = await fetch(`${base}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  if (res.status !== 201 && res.status !== 409) {
    console.error('Signup failed', res.status, await res.text());
    process.exit(1);
  }

  console.log('Login...');
  res = await fetch(`${base}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    console.error('Login failed', res.status, await res.text());
    process.exit(1);
  }
  const { token, user } = await res.json();
  console.log('Token:', token, 'User:', user);

  console.log('Get /users/me with token...');
  res = await fetch(`${base}/v1/users/me`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error('users/me failed', res.status, await res.text());
    process.exit(1);
  }
  const me = await res.json();
  console.log('Me:', me);

  console.log('Logout...');
  res = await fetch(`${base}/v1/auth/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error('Logout failed', res.status, await res.text());
    process.exit(1);
  }

  console.log('Verify token invalid after logout...');
  res = await fetch(`${base}/v1/users/me`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (res.status !== 401) {
    console.error('Expected 401, got', res.status);
    process.exit(1);
  }
  console.log('Session smoke test passed');
}

run().catch((e) => { console.error(e); process.exit(1); });
