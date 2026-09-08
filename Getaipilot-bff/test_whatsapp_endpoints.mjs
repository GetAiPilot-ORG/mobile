async function testUser(email, password) {
  console.log(`\n--- Testing ${email} ---`);
  const loginRes = await fetch('http://localhost:4000/mobile/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Login Status:', loginRes.status);
  console.log('User ID:', loginData.user?.id);
  console.log('Org ID:', loginData.user?.organizationId);
  console.log('Tier:', loginData.user?.subscriptionTier);

  const endpoints = [
    '/mobile/v1/whatsapp/status',
    '/mobile/v1/whatsapp/contacts',
    '/mobile/v1/whatsapp/templates',
    '/mobile/v1/whatsapp/broadcasts',
    '/mobile/v1/whatsapp/usage'
  ];

  for (const ep of endpoints) {
    const res = await fetch('http://localhost:4000' + ep, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log(`GET ${ep} -> ${res.status}`);
  }
}

async function main() {
  await testUser('test@getaipilot.com', 'Password123!');
  await testUser('shwetchourey3@gmail.com', 'Shwet@1234');
}

main().catch(console.error);
