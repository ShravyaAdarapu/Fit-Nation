import {notFound} from 'next/navigation';
import {branches} from '../../../lib/branches';
import BranchProfile from '../../../components/branch-profile';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const branch=branches.find(b=>b.id===slug);return {title:branch?`Fit Nation ${branch.name} | Hours, Equipment, Trainers & Location`:'Branch not found',description:branch?`Explore Fit Nation ${branch.name}, Hyderabad. Check branch information, opening hours, equipment, trainer availability and location. Enquire about your first visit.`:undefined};}
export default async function Branch({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const branch=branches.find(b=>b.id===slug);if(!branch)notFound();return <BranchProfile branch={branch}/>;}
