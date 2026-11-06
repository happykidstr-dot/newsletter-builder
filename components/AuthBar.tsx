'use client';
import {AccountAction} from './AccountAction';
/** Optional compact account control; shares the main editor's Supabase Auth state. */
export function AuthBar(){
  return <div style={{position:'fixed',top:0,right:0,zIndex:9999,padding:'8px 16px'}}><AccountAction/></div>;
}
