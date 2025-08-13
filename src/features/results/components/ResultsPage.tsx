// Local: src/features/results/components/ResultsPage.tsx

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Eye, List, KanbanSquare } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Candidate } from '../../../shared/types';
import { JobPosting } from '../../screening/types';
import { useDataStore } from '../../../shared/store/useDataStore';
import KanbanBoard from './KanbanBoard';
import { Button } from '../../../shared/components/ui/button';
import UploadModal from './UploadModal';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleModal from '../../agenda/components/ScheduleModal';

interface ResultsPageProps {
  selectedJob: JobPosting | null;
  candidates: Candidate[];
  onDataSynced: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ selectedJob, candidates, onDataSynced }) => {
  const { profile } = useAuth();
  const updateCandidateStatus = useDataStore((state) => state.updateCandidateStatus);

  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  
  // Tipagem explícita para o estado
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');
  
  const handleOpenScheduleModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setScheduleModalOpen(true);
  };
  
  const jobCandidates = useMemo(() => {
    if (!selectedJob) return [];
    return candidates.filter(c => c.vaga && c.vaga.some(v => v.id === selectedJob.id));
  }, [selectedJob, candidates]);

  const sortedCandidates = useMemo(() => {
    const sorted = [...jobCandidates];
    sorted.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return sortDirection === 'ascending' ? scoreA - scoreB : scoreB - scoreA;
    });
    return sorted;
  }, [jobCandidates, sortDirection]);

  const handleSort = () => {
    const newDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
    setSortDirection(newDirection);
  };

  const handleStatusUpdate = async (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => {
    await updateCandidateStatus(candidateId, newStatus);
  };

  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <Eye className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Nenhuma Vaga Selecionada</h2>
        <p className="text-gray-500 mt-2">
          Por favor, selecione uma vaga no Dashboard para ver os resultados dos candidatos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">{selectedJob.titulo}</h1>
          <p className="text-gray-500">Resultados da Triagem</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setUploadModalOpen(true)}>
            Adicionar Currículos
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}>
            {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <KanbanSquare className="h-4 w-4" />}
          </Button>
          {viewMode === 'list' && (
            <Button variant="ghost" onClick={handleSort}>
              Score <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        <KanbanBoard
            candidates={sortedCandidates}
            onViewDetails={setSelectedCandidate}
            onScheduleInterview={handleOpenScheduleModal}
            onUpdateStatus={handleStatusUpdate}
        />
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        jobId={selectedJob.id}
        userId={profile!.id}
        onUploadComplete={() => {
          onDataSynced();
          setUploadModalOpen(false);
        }}
      />
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onScheduleInterview={() => handleOpenScheduleModal(selectedCandidate)}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
      {selectedCandidate && isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          candidate={selectedCandidate}
          job={selectedJob}
          onEventScheduled={onDataSynced}
        />
      )}
    </div>
  );
};

export default ResultsPage;