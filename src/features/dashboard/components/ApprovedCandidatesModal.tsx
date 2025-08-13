// Local: src/features/dashboard/components/ApprovedCandidatesModal.tsx

import React from 'react';
import { Candidate } from '../../../shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../shared/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';

interface ApprovedCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

const ApprovedCandidatesModal: React.FC<ApprovedCandidatesModalProps> = ({ isOpen, onClose, candidates }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Candidatos Aprovados</DialogTitle>
          <DialogDescription>
            Lista de todos os candidatos que passaram no processo de triagem com score maior ou igual a 90.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="py-4 flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={candidate.avatar_url || ''} alt={candidate.nome} />
                  <AvatarFallback>{candidate.nome.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">{candidate.nome}</p>
                  <p className="text-sm text-gray-500">{candidate.email || 'E-mail não disponível'}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-green-600">
                    Score: {candidate.score}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovedCandidatesModal;