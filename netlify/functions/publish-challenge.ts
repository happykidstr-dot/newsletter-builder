import type {Config} from '@netlify/functions';
import {issuePublishProof} from '../../lib/native-publish-proof';
export const config:Config={path:'/api/publish-challenge',method:'POST',rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
export default async (req:Request)=>issuePublishProof(req);
