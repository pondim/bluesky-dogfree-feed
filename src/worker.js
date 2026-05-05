const DOGS = /\b(dogs?|puppy|puppies|pupper|doggo|pup|pups|canine|pooch|hound|mutt|woof|bark|bork|goodboy|doggie|furbaby|retriever|labrador|shepherd|bulldog|poodle|beagle|rottweiler|dachshund|corgi|husky|pitbull|chihuahua|doberman|boxer|dalmatian|pomeranian|schnauzer|mastiff|greyhound|collie|spaniel|terrier|akita|malinois|frenchie|samoyed|shiba|dogsofbluesky|dogsofbsky)\b/i;

function hasDog(post) {
    const r = post.post?.record || post.record || {};
    const t = r.text || '';
    if (DOGS.test(t)) return true;
    const e = r.embed || post.post?.embed || {};
    if (e.alt && DOGS.test(e.alt)) return true;
    if (e.images) for (const i of e.images) if (i.alt && DOGS.test(i.alt)) return true;
    if (e.external?.title && DOGS.test(e.external.title)) return true;
    if (e.external?.description && DOGS.test(e.external.description)) return true;
    return false;
}

async function auth(env) {
    const r = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({identifier:env.BLUESKY_HANDLE,password:env.BLUESKY_APP_PASSWORD})
    });
    if (!r.ok) throw new Error('Auth failed: ' + r.status);
    return r.json();
}

export default {
    async fetch(request, env) {
          const url = new URL(request.url);
          const h = url.hostname;
          const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'};
          if (request.method === 'OPTIONS') return new Response(null, {headers:cors});

      if (url.pathname === '/.well-known/did.json') {
              return Response.json({'@context':['https://www.w3.org/ns/did/v1'],id:'did:web:'+h,service:[{id:'#bsky_fg',type:'BskyFeedGenerator',serviceEndpoint:'https://'+h}]},{headers:cors});
      }

      if (url.pathname === '/xrpc/app.bsky.feed.describeFeedGenerator') {
              return Response.json({did:'did:web:'+h,feeds:[{uri:'at://'+env.PUBLISHER_DID+'/app.bsky.feed.generator/dogfree-discover'}]},{headers:cors});
      }

      if (url.pathname === '/xrpc/app.bsky.feed.getFeedSkeleton') {
              try {
                        const cursor = url.searchParams.get('cursor');
                        const limit = Math.min(parseInt(url.searchParams.get('limit')||'50'),100);
                        const s = await auth(env);
                        const p = new URLSearchParams({limit:String(limit*2)});
                        if (cursor) p.set('cursor', cursor);
                        const r = await fetch('https://bsky.social/xrpc/app.bsky.feed.getTimeline?'+p,{headers:{Authorization:'Bearer '+s.accessJwt}});
                        if (!r.ok) throw new Error('Timeline: '+r.status);
                        const d = await r.json();
                        const feed = (d.feed||[]).filter(i=>!hasDog(i)).slice(0,limit).map(i=>({post:i.post.uri}));
                        return Response.json({cursor:d.cursor||'',feed},{headers:cors});
              } catch(e) {
                        return Response.json({error:'InternalServerError',message:e.message},{status:500,headers:cors});
              }
      }

      if (url.pathname==='/'||url.pathname==='/health') return Response.json({status:'ok',feed:'dogfree-discover'},{headers:cors});
          return Response.json({error:'Not Found'},{status:404,headers:cors});
    }
};
