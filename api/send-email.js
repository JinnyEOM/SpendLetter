export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to_email, user_name, today_date, categories, send_time, app_url } = req.body;

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email,
        user_name,
        today_date,
        categories,
        send_time,
        app_url
      }
    })
  });

  if (response.ok) {
    res.status(200).json({ ok: true });
  } else {
    const error = await response.text();
    res.status(500).json({ error });
  }
}