import {memberAuth} from '../runtime';
export async function GET(request: Request) {return memberAuth().session(request);}
