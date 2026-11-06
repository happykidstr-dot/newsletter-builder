import {createHmac} from 'node:crypto';

export function suppressionHash(email:string):string{
 const secret=process.env.CAMPAIGN_SECURITY_SECRET;
 if(!secret||secret.length<32)throw new Error('CAMPAIGN_SECURITY_NOT_CONFIGURED');
 return createHmac('sha256',secret).update(email.trim().toLowerCase()).digest('hex');
}
