/**
 * Explicit BÜLTEN READ editorial policy.
 * These are verified Supabase Auth emails, not user-submitted form values.
 * The public reader routes do not use this list.
 */
const APPROVED_PUBLISHERS = new Set([
  'happykidstr@gmail.com',
  'projefabrikasitr@gmail.com',
]);
export function isApprovedPublisher(email:unknown,verified:boolean):boolean{
  return verified===true&&typeof email==='string'&&
    APPROVED_PUBLISHERS.has(email.trim().toLowerCase());
}
export const AUTHORISED_PUBLISHER_COUNT=APPROVED_PUBLISHERS.size;
