const fetch = require('node-fetch');

async function check() {
    const res = await fetch('http://127.0.0.1:8081/api/auth/recovery/check-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ahmedkhlifi0707@gmail.com' })
    });
    const data = await res.json();
    console.log("Response for Super Admin:", data);
}

check();
