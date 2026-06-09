import https from 'https';

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const parsed = new URL(url);
    options.hostname = parsed.hostname;
    options.path = parsed.pathname;

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
  console.log('[send-email] ENV CHECK:', {
    SERVICE_ID: EMAILJS_SERVICE_ID ? 'OK' : 'MISSING',
    TEMPLATE_ID: EMAILJS_TEMPLATE_ID ? 'OK' : 'MISSING',
    PUBLIC_KEY: EMAILJS_PUBLIC_KEY ? 'OK' : 'MISSING',
    PRIVATE_KEY: EMAILJS_PRIVATE_KEY ? `OK (${EMAILJS_PRIVATE_KEY.slice(0,4)}...)` : 'MISSING'
  });
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    return res.status(500).json({ error: 'EmailJS 환경변수가 설정되지 않았습니다.' });
  }

  const { to_email, user_name, today_date, categories, send_time, app_url } = req.body || {};
  if (!to_email) {
    return res.status(400).json({ error: '수신 이메일 주소가 없습니다.' });
  }

  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: { to_email, user_name, today_date, categories, send_time, app_url }
    };

    const result = await httpsPost('https://api.emailjs.com/api/v1.0/email/send', payload);

    if (result.status === 200) {
      return res.status(200).json({ ok: true });
    }
    return res.status(result.status).json({ error: `EmailJS ${result.status}: ${result.body}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
