import {openDB} from 'idb';
const db=await openDB('expiry-v3',1,{upgrade(db){db.createObjectStore('kv');}});
export const get=key=>db.get('kv',key);
export const set=(key,value)=>db.put('kv',value,key);
export async function change(key,fn){const tx=db.transaction('kv','readwrite');const value=fn(await tx.store.get(key));await tx.store.put(value,key);await tx.done;return value;}
