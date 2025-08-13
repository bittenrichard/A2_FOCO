// Local: src/features/dashboard/hooks/useDashboardStats.ts
import { useMemo } from 'react';
import { JobPosting } from '../../screening/types';
import { Candidate } from '../../../shared/types';

export interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  averageScore: number;
  approvedCandidates: number;
}

export const useDashboardStats = (jobs: JobPosting[], candidates: Candidate[]) => {
  const stats: DashboardStats = useMemo(() => {
    const activeJobs = jobs.length;

    // CORREÇÃO: Considerar apenas candidatos de vagas que existem atualmente
    const activeJobIds = new Set(jobs.map(job => job.id));
    
    const activeCandidates = candidates.filter(candidate =>
        candidate.vaga && candidate.vaga.some(v => activeJobIds.has(v.id))
    );

    const totalCandidates = activeCandidates.length;

    const approvedCandidates = activeCandidates.filter(
      (c) => c.score && Number(c.score) >= 90
    ).length;

    let averageScore = 0;
    if (totalCandidates > 0) {
      // CORREÇÃO: Forçar a conversão do score para número antes de somar
      const totalScore = activeCandidates.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
      averageScore = Math.round(totalScore / totalCandidates);
    }

    return {
      activeJobs,
      totalCandidates,
      averageScore,
      approvedCandidates,
    };
  }, [jobs, candidates]);

  return { stats };
};