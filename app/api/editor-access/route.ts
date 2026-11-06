import {NextResponse} from 'next/server';
import {requireAuthorizedPublisher} from '@/lib/security/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Never render the editor before this server-verified access decision. */
export async function GET(){
  const identity=await requireAuthorizedPublisher();
  if(identity.error)return identity.error;
  return NextResponse.json({allowed:true},{headers:{'Cache-Control':'private, no-store'}});
}
