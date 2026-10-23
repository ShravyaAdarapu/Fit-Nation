import {memberAuth} from '../runtime';
export async function POST(request: Request) {return memberAuth().logout(request);}
