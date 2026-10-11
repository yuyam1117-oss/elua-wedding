const json=(data,status=200)=>Response.json(data,{status});
function authorized(request,env){return Boolean(env.ADMIN_PASSWORD)&&request.headers.get('X-Admin-Password')===env.ADMIN_PASSWORD}
export async function onRequest({request,env}){
 if(!authorized(request,env))return json({error:'ログインが必要です。'},401);
 if(!env.DB)return json({error:'D1のDB設定がありません。'},503);
 if(request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM plans ORDER BY sort_order,id').all();return json({plans:results});}
 if(request.method==='POST'||request.method==='PUT'){
  let b;try{b=await request.json()}catch{return json({error:'JSONが不正です。'},400)}
  const title=String(b.title||'').trim().slice(0,160),category=String(b.category||'').trim().slice(0,80),description=String(b.description||'').trim().slice(0,2000),price=String(b.price||'要相談').trim().slice(0,120),image_url=String(b.image_url||'').trim().slice(0,1000),sort_order=Math.max(0,Math.min(9999,Number(b.sort_order)||0)),is_published=b.is_published===false||b.is_published===0?0:1;
  if(!title||!description)return json({error:'プラン名と説明を入力してください。'},400);
  if(image_url && !/^https:\/\//i.test(image_url))return json({error:'画像URLはhttps://から始まるURLを入力してください。'},400);
  if(request.method==='POST'){await env.DB.prepare('INSERT INTO plans(sort_order,title,category,description,price,image_url,is_published,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)').bind(sort_order,title,category,description,price,image_url,is_published).run();return json({ok:true},201)}
  const id=Number(b.id);if(!Number.isInteger(id)||id<1)return json({error:'編集対象IDが不正です。'},400);
  const r=await env.DB.prepare('UPDATE plans SET sort_order=?,title=?,category=?,description=?,price=?,image_url=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(sort_order,title,category,description,price,image_url,is_published,id).run();if(!r.meta?.changes)return json({error:'対象のプランが見つかりません。'},404);return json({ok:true});
 }
 if(request.method==='DELETE'){let b;try{b=await request.json()}catch{return json({error:'JSONが不正です。'},400)}const id=Number(b.id);if(!Number.isInteger(id)||id<1)return json({error:'IDが不正です。'},400);await env.DB.prepare('DELETE FROM plans WHERE id=?').bind(id).run();return json({ok:true})}
 return json({error:'Method not allowed'},405)
}
