export async function onRequestGet({request,env,params}) {
 if(!env.MEDIA)return new Response('Media storage is not configured.',{status:503});
 const raw=Array.isArray(params.path)?params.path.join('/'):String(params.path||'');
 if(!raw.startsWith('gallery/')||raw.includes('..')||raw.includes('\\'))return new Response('Not found',{status:404});
 const object=await env.MEDIA.get(raw);if(!object)return new Response('Not found',{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set('etag',object.httpEtag);headers.set('cache-control','public, max-age=31536000, immutable');headers.set('X-Content-Type-Options','nosniff');return new Response(request.method==='HEAD'?null:object.body,{headers});
}
export async function onRequestHead(context){return onRequestGet(context)}
