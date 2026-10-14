import { json, authorized, safeText } from '../_utils.js';

const defaultNav = [
  ['home', 'HOME', 1], ['plans', '料金プラン', 2], ['flow', '予約の流れ', 3],
  ['gallery', '作品ギャラリー', 4], ['news', 'お知らせ', 5], ['faq', 'よくある質問', 6],
  ['contact', 'お問い合わせ', 7], ['privacy', 'プライバシーポリシー', 8]
];
const defaults = {
  site_name: 'Elua Wedding', hero_title: 'ふたりらしい、あたたかな一日を。',
  hero_text: '大切な人たちと、心から笑える結婚式。Elua Weddingが、ふたりの想いをかたちにします。', hero_image_url: '',
  concept_title: '結婚式に、決まった正解はない。', concept_text: '好きなものも、大切にしたいことも、ふたりだけのもの。背伸びしすぎず、ふたりのペースで。',
  contact_title: 'まずは、お話ししませんか。', contact_text: '結婚式のこと、予算のこと、まだ漠然としたイメージでも。ふたりのペースで、お気軽にお問い合わせください。',
  contact_email: '', instagram_url: '', youtube_url: '', line_url: '', show_line_button: 'true', show_instagram_button: 'true', show_youtube_button: 'true', phone: '', address: '', footer_text: 'ふたりらしい、あたたかなウェディングを。',
  hero_note: '小さな疑問から、お気軽にご相談ください。', hero_kicker: 'YOUR STORY, YOUR WEDDING', hero_cta_text: '相談してみる', concept_kicker: 'OUR CONCEPT', concept_intro: '好きなものも、大切にしたいことも、ふたりだけのもの。', plans_intro: 'ご希望に合わせて内容をカスタマイズできます。', news_kicker: 'NEWS', gallery_intro: 'Elua Weddingがつくる一日のイメージをご紹介します。', gallery_kicker: 'GALLERY', flow_kicker: 'HOW IT WORKS', faq_kicker: 'FAQ', contact_kicker: 'CONTACT', contact_button_text: 'お問い合わせを送信', contact_small: '送信後、担当者よりご連絡いたします。',
  plans_title: 'ふたりに合うスタイルを。', news_title: 'お知らせ', gallery_title: '思い出のかたち', flow_title: 'ご相談から当日まで',
  privacy_text: '個人情報の取り扱いについて\nお問い合わせフォームでお預かりした情報は、お問い合わせへの回答および必要なご連絡のために利用します。法令に基づく場合を除き、ご本人の同意なく第三者に提供しません。',
  nav_items_json: defaultNav.map(row => row.join('|')).join('\n'),
  home_values_json: JSON.stringify([
    { title: 'ふたりの想いから', text: '何を大切にしたいか、ゆっくり聞かせてください。' },
    { title: '無理のないプラン', text: 'ご希望とご予算に合わせて、柔軟にご提案します。' },
    { title: 'あたたかなサポート', text: '準備の時間も、安心して楽しめるよう寄り添います。' }
  ]),
  flow_steps_json: JSON.stringify([
    { title: 'まずは気軽にご相談', text: '決まっていないことが多くても大丈夫です。' },
    { title: 'おふたりの希望を整理', text: 'イメージやご予算を伺い、プランをご提案します。' },
    { title: '準備を一緒に進める', text: '必要なことを一つずつ、無理なく進めていきます。' },
    { title: '心に残る一日へ', text: '当日も安心して楽しめるようサポートします。' }
  ]),
  faq_items_json: JSON.stringify([
    { question: 'まだ何も決まっていなくても相談できますか？', answer: 'もちろんです。イメージが固まっていない段階から、お気軽にご相談ください。' },
    { question: '予算に合わせた提案はできますか？', answer: 'ご希望とご予算を伺い、無理のない内容をご提案します。' },
    { question: 'ウェディングフォトだけでも依頼できますか？', answer: 'ご希望の内容を伺い、対応できるプランをご案内します。' }
  ])
};

function validMedia(value) {
  return /^https:\/\//i.test(value) || /^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(value);
}

export async function onRequest({ request, env }) {
  if (!authorized(request, env)) return json({ error: '認証に失敗しました。再ログインしてください。' }, 401);
  if (!env.DB) return json({ error: 'D1のDB設定がありません。Cloudflare PagesのDBバインディングを確認してください。' }, 503);

  if (request.method === 'GET') {
    const content = { ...defaults };
    const { results = [] } = await env.DB.prepare('SELECT key,value FROM site_content').all();
    for (const row of results) content[row.key] = row.value;
    return json({ content });
  }

  if (request.method !== 'PUT') return json({ error: 'Method not allowed' }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ error: '送信データの形式が正しくありません。' }, 400); }
  const content = body.content || {};
  const keys = Object.keys(content).filter(key => Object.hasOwn(defaults, key));
  if (!keys.length) return json({ error: '保存する設定項目がありません。' }, 400);

  for (const key of keys) {
    const max = ['hero_image_url'].includes(key) ? 950000 : ['privacy_text', 'flow_steps_json', 'faq_items_json', 'home_values_json', 'nav_items_json'].includes(key) ? 12000 : key.endsWith('_text') ? 3000 : 2000;
    const value = safeText(content[key], max);
    if (key === 'hero_image_url' && value && !validMedia(value)) return json({ error: 'トップ画像はHTTPSのURLか、対応画像ファイルをアップロードしてください。' }, 400);
    if (['instagram_url', 'youtube_url', 'line_url'].includes(key) && value && !/^https:\/\//i.test(value)) return json({ error: `${key} はhttps://から始まるURLを入力してください。` }, 400);
    if (key === 'contact_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return json({ error: '通知先メールアドレスを確認してください。' }, 400);
    if (['flow_steps_json', 'faq_items_json', 'home_values_json'].includes(key)) {
      try { if (!Array.isArray(JSON.parse(value || '[]'))) throw new Error(); }
      catch { return json({ error: `${key} のJSON形式を確認してください。` }, 400); }
    }
    await env.DB.prepare('INSERT INTO site_content(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, value).run();
  }
  return json({ ok: true });
}
