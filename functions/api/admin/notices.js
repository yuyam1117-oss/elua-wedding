import { json, authorized, safeText } from '../_utils.js';
export async function onRequest({request, env}) {
 if (!authorized(request, env)) return json({error:'ログインが必要です。'},401);
 if (!env.DB) return json({error:'D1のDB設定がありません。'},503);
 if (request.method==='GET') { const {results=[]}=await env.DB.prepare('SELECT * FROM notices ORDER BY published_at DESC, id DESC').all(); return json({notices:results}); }
 if (request.method==='POST'||request.method==='PUT'||request.method==='DELETE') { let b; try { b=await request.json(); } catch { return json({error:'JSONが不正です。'},400); }
  if (request.method==='DELETE') { const id=Number(b.id); if(!Number.isInteger(id)||id<1)return json({error:'IDが不正です。'},400); const r=await env.DB.prepare('DELETE FROM notices WHERE id=?').bind(id).run(); if(!r.meta?.changes)return json({error:'お知らせが見つかりません。'},404); return json({ok:true}); }
  const title=safeText(b.title,160), body=safeText(b.body,5000), published_at=safeText(b.published_at,40)||new Date().toISOString().slice(0,10), is_published=b.is_published===false||b.is_published===0?0:1;
  if(!title||!body)return json({error:'タイトルと本文を入力してください。'},400);
  if(request.method==='POST'){await env.DB.prepare('INSERT INTO notices(title,body,published_at,is_published) VALUES(?,?,?,?)').bind(title,body,published_at,is_published).run();return json({ok:true},201)}
  const id=Number(b.id); if(!Number.isInteger(id)||id<1)return json({error:'IDが不正です。'},400); const r=await env.DB.prepare('UPDATE notices SET title=?,body=?,published_at=?,is_published=? WHERE id=?').bind(title,body,published_at,is_published,id).run(); if(!r.meta?.changes)return json({error:'お知らせが見つかりません。'},404); return json({ok:true});
 } return json({error:'Method not allowed'},405);
}
