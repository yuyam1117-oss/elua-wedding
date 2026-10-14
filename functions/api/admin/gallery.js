import { json, authorized, safeText, validImageUrl } from '../_utils.js';
export async function onRequest({request, env}) {
 if(!authorized(request,env))return json({error:'ログインが必要です。'},401); if(!env.DB)return json({error:'D1のDB設定がありません。'},503);
 if(request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM gallery_items ORDER BY sort_order,id').all();return json({items:results});}
 if(!['POST','PUT','DELETE'].includes(request.method))return json({error:'Method not allowed'},405); let b;try{b=await request.json()}catch{return json({error:'JSONが不正です。'},400)}
 if(request.method==='DELETE'){const id=Number(b.id);if(!Number.isInteger(id)||id<1)return json({error:'IDが不正です。'},400);const r=await env.DB.prepare('DELETE FROM gallery_items WHERE id=?').bind(id).run();if(!r.meta?.changes)return json({error:'写真が見つかりません。'},404);return json({ok:true})}
 const title=safeText(b.title,160),description=safeText(b.description,1000),image_url=safeText(b.image_url,950000),category=safeText(b.category,80)||'WEDDING',sort_order=Math.max(0,Math.min(9999,Number(b.sort_order)||0)),is_published=b.is_published===false||b.is_published===0?0:1;
 if(!image_url||!(validImageUrl(image_url)||/^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(image_url)||/^\/media\/[a-zA-Z0-9/_-]+\.(jpg|png|webp|gif)$/i.test(image_url)))return json({error:'画像URLはhttps://のURL、またはアップロード済み画像を指定してください。'},400);
 if(request.method==='POST'){await env.DB.prepare('INSERT INTO gallery_items(sort_order,title,description,image_url,category,is_published,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').bind(sort_order,title,description,image_url,category,is_published).run();return json({ok:true},201)}
 const id=Number(b.id);if(!Number.isInteger(id)||id<1)return json({error:'IDが不正です。'},400);const r=await env.DB.prepare('UPDATE gallery_items SET sort_order=?,title=?,description=?,image_url=?,category=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(sort_order,title,description,image_url,category,is_published,id).run();if(!r.meta?.changes)return json({error:'写真が見つかりません。'},404);return json({ok:true});
}
