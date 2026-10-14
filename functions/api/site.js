const defaults = {
  site_name: 'Elua Wedding', hero_title: 'ふたりらしい、あたたかな一日を。',
  hero_text: '大切な人たちと、心から笑える結婚式。Elua Weddingが、ふたりの想いをかたちにします。', hero_image_url: '',
  concept_title: '結婚式に、決まった正解はない。', concept_text: '好きなものも、大切にしたいことも、ふたりだけのもの。背伸びしすぎず、ふたりのペースで。',
  contact_title: 'まずは、お話ししませんか。', contact_text: '結婚式のこと、予算のこと、まだ漠然としたイメージでも。ふたりのペースで、お気軽にお問い合わせください。',
  contact_email: '', instagram_url: '', youtube_url: '', line_url: '', show_line_button: 'true', show_instagram_button: 'true', show_youtube_button: 'true', phone: '', address: '', footer_text: 'ふたりらしい、あたたかなウェディングを。',
  hero_note: '小さな疑問から、お気軽にご相談ください。', hero_kicker: 'YOUR STORY, YOUR WEDDING', hero_cta_text: '相談してみる', concept_kicker: 'OUR CONCEPT', concept_intro: '好きなものも、大切にしたいことも、ふたりだけのもの。', plans_intro: 'ご希望に合わせて内容をカスタマイズできます。', news_kicker: 'NEWS', gallery_intro: 'Elua Weddingがつくる一日のイメージをご紹介します。', gallery_kicker: 'GALLERY', flow_kicker: 'HOW IT WORKS', faq_kicker: 'FAQ', contact_kicker: 'CONTACT', contact_button_text: 'お問い合わせを送信', contact_small: '送信後、担当者よりご連絡いたします。',
  plans_title: 'ふたりに合うスタイルを。', news_title: 'お知らせ', gallery_title: '思い出のかたち', flow_title: 'ご相談から当日まで',
  privacy_text: '個人情報の取り扱いについて\nお問い合わせフォームでお預かりした情報は、お問い合わせへの回答および必要なご連絡のために利用します。法令に基づく場合を除き、ご本人の同意なく第三者に提供しません。',
  nav_items_json: 'home|HOME|1\nplans|料金プラン|2\nflow|予約の流れ|3\ngallery|作品ギャラリー|4\nnews|お知らせ|5\nfaq|よくある質問|6\ncontact|お問い合わせ|7\nprivacy|プライバシーポリシー|8',
  home_values_json: JSON.stringify([{ title: 'ふたりの想いから', text: '何を大切にしたいか、ゆっくり聞かせてください。' }, { title: '無理のないプラン', text: 'ご希望とご予算に合わせて、柔軟にご提案します。' }, { title: 'あたたかなサポート', text: '準備の時間も、安心して楽しめるよう寄り添います。' }]),
  flow_steps_json: JSON.stringify([{ title: 'まずは気軽にご相談', text: '決まっていないことが多くても大丈夫です。' }, { title: 'おふたりの希望を整理', text: 'イメージやご予算を伺い、プランをご提案します。' }, { title: '準備を一緒に進める', text: '必要なことを一つずつ、無理なく進めていきます。' }, { title: '心に残る一日へ', text: '当日も安心して楽しめるようサポートします。' }]),
  faq_items_json: JSON.stringify([{ question: 'まだ何も決まっていなくても相談できますか？', answer: 'もちろんです。イメージが固まっていない段階から、お気軽にご相談ください。' }, { question: '予算に合わせた提案はできますか？', answer: 'ご希望とご予算を伺い、無理のない内容をご提案します。' }, { question: 'ウェディングフォトだけでも依頼できますか？', answer: 'ご希望の内容を伺い、対応できるプランをご案内します。' }])
};
export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ content: defaults });
  const { results = [] } = await env.DB.prepare('SELECT key,value FROM site_content').all();
  const content = { ...defaults };
  for (const row of results) content[row.key] = row.value;
  return Response.json({ content });
}
