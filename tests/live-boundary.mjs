import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import config from '../src/store-config.js';
const api=createClient(config.VITE_SUPABASE_URL,config.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),s=config.VITE_STORE_ID;
const check=r=>{if(r.error)throw Error(r.error.message);return r.data;};
try{
 const settings=await fetch(config.VITE_SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:config.VITE_SUPABASE_ANON_KEY}}).then(r=>r.json());assert.equal(settings.external.anonymous_users,true);console.log('PASS: project accepts public key and anonymous sign-in enabled');
 check(await api.auth.signInAnonymously());console.log('PASS: actual anonymous device authentication');
 assert.equal(check(await api.rpc('join_store',{s,p:null})),false);console.log('PASS: null password rejected on live server');
 assert.equal(check(await api.rpc('join_store',{s,p:'wrong-boundary-test-'+Date.now()})),false);console.log('PASS: wrong password rejected on live server');
 assert.equal(check(await api.rpc('is_member',{s})),false);console.log('PASS: device without password has no membership');
 const products=check(await api.from('products').select('id').eq('store_id',s));assert.deepEqual(products,[]);console.log('PASS: nonmember cannot read products');
 const secrets=await api.from('stores').select('password_hash').eq('id',s);assert.ok(secrets.error);console.log('PASS: nonmember cannot read password hash');
 const write=await api.rpc('apply_operation',{op:crypto.randomUUID(),s,pid:crypto.randomUUID(),kind:'delete',expected:1,payload:{}});assert.ok(write.error?.message.includes('ACCESS_DENIED'));console.log('PASS: nonmember write rejected');
 const image=await api.storage.from('expiry-photos').download(s+'/00000000-0000-4000-a000-000000000000.jpg');assert.ok(image.error);console.log('PASS: unauthorised photo download denied (nonexistent test path)');
 await api.auth.signOut();console.log('Completed live negative-access checks; successful store login and shared edits require owner verification.');
}catch(e){console.error('FAIL:',e.message);process.exitCode=1;}
