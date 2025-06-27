import { Member } from '@/lib/types';
import MemberCard from './MemberCard';

interface MembersGridProps {
  members: Member[];
  departmentId: string;
}

export default function MembersGrid({ members, departmentId }: MembersGridProps) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>没有找到任何成员。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} departmentId={departmentId} />
      ))}
    </div>
  );
} 