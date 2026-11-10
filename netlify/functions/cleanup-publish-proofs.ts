import type {Config} from '@netlify/functions';
import {abuseStore} from '../../lib/newsletter-publication-store';
export const config:Config={schedule:'@daily'};
export default async()=>{
  const store=abuseStore('bultenoku.netlify.app');let removed=0;
  for await(const page of store.list({paginate:true})){
    for(const {key} of page.blobs){
      if(key==='signing-key-v1')continue;
      const row=await store.get(key,{type:'json'}) as {updatedAt?:number}|null;
      if(typeof row?.updatedAt==='number'&&row.updatedAt<Date.now()-2*86_400_000){await store.delete(key);removed++;}
    }
  }
  return Response.json({removed});
};
