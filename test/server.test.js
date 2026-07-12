const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');

test('health endpoint returns ok', async () => {
  const { app, server } = createServer();

  const response = await new Promise((resolve, reject) => {
    const port = 4101;
    server.listen(port, () => {
      const http = require('http');
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close(() => resolve({ statusCode: res.statusCode, body: data }));
        });
      }).on('error', reject);
    });
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /"status":"ok"/);
});

test('root endpoint returns service metadata', async () => {
  const { app, server } = createServer();

  const response = await new Promise((resolve, reject) => {
    const port = 4102;
    server.listen(port, () => {
      const http = require('http');
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close(() => resolve({ statusCode: res.statusCode, body: data }));
        });
      }).on('error', reject);
    });
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /"service":"multiplayer-service"/);
});
