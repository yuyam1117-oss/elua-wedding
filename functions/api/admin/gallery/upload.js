import { json, authorized } from '../../_utils.js';
export async function onRequestPost({request,env}) {
 if(!authorized(request,env))return json({error:'ログインが必要です。'},401);
 if(!env.MEDIA)return json({error:'画像保存用R2バケットMEDIAが未設定です。CloudflareのR2バインディングを設定してください。'},503);
 const form=await request.formData().catch(()=>null);const file=form?.get('image');if(!file||typeof file.arrayBuffer!=='function')return json({error:'画像ファイルを選択してください。'},400);
 const type=String(file.type||'').toLowerCase();const allowed={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};if(!allowed[type])return json({error:'JPEG・PNG・WebP・GIF画像のみアップロードできます。'},415);if(file.size>8*1024*1024)return json({error:'画像は8MB以下にしてください。'},413);
 const key=`gallery/${crypto.randomUUID()}.${allowed[type]}`;try{await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:type,cacheControl:'public, max-age=31536000, immutable'}});return json({ok:true,key,url:`/media/${key}`},201)}catch(error){console.error('R2 upload failed',error);return json({error:'画像を保存できませんでした。R2設定を確認してください。'},500)}
}
