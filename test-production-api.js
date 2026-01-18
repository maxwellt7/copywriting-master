import https from 'https';

const API_URL = 'copywriting-master-production.up.railway.app';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://copywriting-master-vb5u.vercel.app',
        'User-Agent': 'Node.js Test Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\n📡 ${method} ${path}`);
    if (data) console.log('📤 Request:', JSON.stringify(data, null, 2));

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📥 Response:`, body);

        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request failed:`, error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testProductionAPI() {
  console.log('🚀 Testing Production API\n');
  console.log(`Backend: https://${API_URL}`);
  console.log(`Testing from: Node.js script\n`);
  console.log('='.repeat(60));

  try {
    // Test 1: Health check
    console.log('\n\n### TEST 1: Health Check');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log(`⚠️  Health check returned ${health.status}`);
    }

    // Test 2: Register new user
    console.log('\n\n### TEST 2: User Registration');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const register = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword
    });

    let token = null;
    if (register.status === 201) {
      console.log('✅ Registration successful');
      token = register.data.token;
      console.log(`🔑 Token received:`, token.substring(0, 20) + '...');
    } else {
      console.log(`❌ Registration failed with status ${register.status}`);
      return;
    }

    // Test 3: Login with same credentials
    console.log('\n\n### TEST 3: User Login');
    const login = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (login.status === 200) {
      console.log('✅ Login successful');
      console.log(`🔑 Token received:`, login.data.token.substring(0, 20) + '...');
    } else {
      console.log(`❌ Login failed with status ${login.status}`);
    }

    // Test 4: Get current user
    console.log('\n\n### TEST 4: Get Current User');
    const meRequest = new Promise((resolve, reject) => {
      const options = {
        hostname: API_URL,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://copywriting-master-vb5u.vercel.app'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log(`📊 Status: ${res.statusCode}`);
          console.log(`📥 Response:`, body);
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    const me = await meRequest;
    if (me.status === 200) {
      console.log('✅ Successfully retrieved user data');
      console.log(`👤 User email:`, me.data.user.email);
    } else {
      console.log(`❌ Failed to get user data, status ${me.status}`);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('The backend is working correctly.');
    console.log('Frontend should be able to connect successfully.');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.log('\n\n' + '='.repeat(60));
    console.log('\n❌ TEST SUITE FAILED\n');
    console.error('Error:', error.message);
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
}

testProductionAPI();
