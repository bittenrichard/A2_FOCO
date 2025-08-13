// Local: src/features/dashboard/components/DashboardPage.tsx

import React, { useMemo, useState } from 'react';
import StatCard from './StatCard';
import RecentScreenings from './RecentScreenings';
import WelcomeEmptyState from './WelcomeEmptyState';
import { useDashboardStats } from '../hooks/useDashboardStats';
import ApprovedCandidatesModal from './ApprovedCandidatesModal';
import { JobPosting } from '../../screening/types';
import { Candidate, PageKey } from '../../../shared/types';
import { Users, FileText, UserCheck, Star } from 'lucide-react';

interface DashboardPageProps {
  jobs: JobPosting[];
  candidates: Candidate[];
  onViewResults: (job: JobPosting) => void;
  onEditJob: (job: JobPosting) => void;
  onDeleteJob: (jobId: number) => void;
  onNavigate: (page: PageKey) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ jobs, candidates, onViewResults, onEditJob, onDeleteJob, onNavigate }) => {
  const { stats } = useDashboardStats(jobs, candidates);
  const [isModalOpen, setModalOpen] = useState(false);

  const approvedCandidates = useMemo(() => {
    const activeJobIds = new Set(jobs.map(job => job.id));
    return candidates.filter(candidate => 
        (candidate.score && candidate.score >= 90) &&
        candidate.vaga && candidate.vaga.some((v: { id: number }) => activeJobIds.has(v.id))
    );
  }, [jobs, candidates]);

  const recentJobs = useMemo(() => {
    const sortedJobs = [...jobs].sort((a, b) => new Date(b.order).getTime() - new Date(a.order).getTime());
    return sortedJobs.slice(0, 5);
  }, [jobs]);
  
  const jobsWithCandidateCounts = useMemo(() => {
    return recentJobs.map(job => {
        const count = candidates.filter(c => c.vaga && c.vaga.some((v: {id: number}) => v.id === job.id)).length;
        return { ...job, candidateCount: count };
    });
  }, [recentJobs, candidates]);


  if (jobs.length === 0) {
    return <WelcomeEmptyState onNavigate={() => onNavigate('new-screening')} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} title="Vagas Ativas" value={stats.activeJobs} />
        <StatCard icon={Users} title="Total de Candidatos" value={stats.totalCandidates} />
        <StatCard icon={UserCheck} title="Candidatos Aprovados" value={stats.approvedCandidates} unit="candidatos" onAction={() => setModalOpen(true)} isActionable={true}/>
        <StatCard icon={Star} title="Score Médio" value={stats.averageScore} unit="pontos" />
      </div>

      <RecentScreenings
        jobs={jobsWithCandidateCounts}
        onViewResults={onViewResults}
        onEditJob={onEditJob}
        onDeleteJob={onDeleteJob}
        onNavigate={onNavigate}
      />
      
      <ApprovedCandidatesModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        candidates={approvedCandidates}
      />
    </div>
  );
};

export default DashboardPage;