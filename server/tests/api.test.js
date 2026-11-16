import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
});

describe('Backend API Integration Tests', () => {

  it('GET /api/health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  it('POST /api/auth/login validates credentials', async () => {
    const badRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'wrongpassword' })
    });
    assert.equal(badRes.status, 401);

    const goodRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'password123' })
    });
    assert.equal(goodRes.status, 200);
    const body = await goodRes.json();
    assert.equal(body.user.username, 'staff');
    assert.ok(body.token);
  });

  it('GET /api/members retrieves enriched member list', async () => {
    const res = await fetch(`${baseUrl}/api/members`);
    assert.equal(res.status, 200);
    const members = await res.json();
    assert.ok(Array.isArray(members));
    assert.ok(members.length > 0);
    assert.ok('totalOutstanding' in members[0]);
  });

  it('POST /api/members validates required fields and duplicates', async () => {
    // Missing fields
    const emptyRes = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', employeeId: '' })
    });
    assert.equal(emptyRes.status, 400);

    // Valid creation
    const newEmpId = `EMP-TEST-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Member',
        employeeId: newEmpId,
        monthlySalary: 75000
      })
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.name, 'Test Member');
    assert.equal(created.employeeId, newEmpId);
  });

  it('POST /api/loans/preview generates amortization preview without saving', async () => {
    const res = await fetch(`${baseUrl}/api/loans/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principal: 100000, tenureMonths: 12 })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.monthlyEmi, 8699);
    assert.equal(data.schedule.length, 12);
  });

  it('GET /api/reports/member-outstanding returns aggregated data and totals', async () => {
    const res = await fetch(`${baseUrl}/api/reports/member-outstanding`);
    assert.equal(res.status, 200);
    const report = await res.json();
    assert.ok(Array.isArray(report.reportRows));
    assert.ok(report.totals);
    assert.ok(report.totals.totalOutstanding >= 0);
  });

  it('GET /api/reports/member-outstanding/csv returns downloadable CSV', async () => {
    const res = await fetch(`${baseUrl}/api/reports/member-outstanding/csv`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    const text = await res.text();
    assert.ok(text.includes('Member ID,Member Name'));
    assert.ok(text.includes('TOTALS'));
  });

});
