const json = (data, status = 200) => Response.json(data, { status });
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'お問い合わせ機能の初期設定が完了していません。' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: '入力内容を読み取れませんでした。' }, 400); }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const topic = String(body.topic || 'その他').trim().slice(0, 120);
  const message = String(body.message || '').trim();
  if (!name || name.length > 100 || !email || email.length > 200 || !validEmail(email) || !message || message.length > 5000) {
    return json({ error: '入力内容を確認してください。' }, 400);
  }

  try {
    await env.DB.prepare('INSERT INTO inquiries (name,email,topic,message,created_at) VALUES (?,?,?,?,?)')
      .bind(name, email, topic, message, new Date().toISOString()).run();
  } catch (error) {
    console.error('Contact save error', error);
    return json({ error: 'お問い合わせの保存に失敗しました。時間をおいて再度お試しください。' }, 500);
  }

  // Recipient is configured in the admin panel. The sender and API key are secrets in Cloudflare.
  const recipient = String((await env.DB.prepare("SELECT value FROM site_content WHERE key='contact_email'").first())?.value || '').trim();
  if (!recipient || !validEmail(recipient) || !env.RESEND_API_KEY || !env.MAIL_FROM) {
    // Keep the inquiry saved even when email notification hasn't been configured yet.
    return json({ ok: true, emailSent: false, notice: 'お問い合わせは保存されましたが、メール通知の設定が未完了です。管理者は設定を確認してください。' }, 201);
  }

  const safe = value => value.replace(/[<>]/g, '');
  const text = `Elua Weddingにお問い合わせが届きました。\n\nお名前：${safe(name)}\nメールアドレス：${safe(email)}\nお問い合わせ内容：${safe(topic)}\n\n${message}\n\n受信日時：${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [recipient], reply_to: email, subject: `【Elua Wedding】お問い合わせ：${topic}`, text })
    });
    if (!response.ok) {
      console.error('Email provider error', response.status, (await response.text()).slice(0, 500));
      return json({ ok: true, emailSent: false, notice: 'お問い合わせは保存されましたが、メール通知に失敗しました。管理画面のお問い合わせ一覧をご確認ください。' }, 201);
    }
    return json({ ok: true, emailSent: true }, 201);
  } catch (error) {
    console.error('Email send error', error);
    return json({ ok: true, emailSent: false, notice: 'お問い合わせは保存されましたが、メール通知に失敗しました。管理画面のお問い合わせ一覧をご確認ください。' }, 201);
  }
}
