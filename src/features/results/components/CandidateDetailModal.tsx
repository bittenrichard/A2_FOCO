// Local: src/features/results/components/CandidateDetailModal.tsx

import React, { useEffect, useState } from 'react';
import { Candidate } from '../../../shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../shared/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../../../shared/components/ui/avatar';
import { Button } from '../../../shared/components/ui/button';
import BehavioralProfileChart from './BehavioralProfileChart';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface BehavioralProfile {
  executor: number;
  comunicador: number;
  planejador: number;
  analista: number;
  analise_ia: {
    perfil_dominante: string;
    caracteristicas: string[];
    pontos_fortes: string[];
    pontos_de_melhoria: string[];
  };
}
interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, status: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose }) => {
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (candidate) {
      setIsLoadingProfile(true);
      setProfileError(null);
      fetch(`${API_BASE_URL}/api/candidates/${candidate.id}/behavioral-profile`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProfile(data.profile);
          } else {
            setProfileError('Não foi possível carregar os dados do perfil.');
          }
        })
        .catch(() => setProfileError('Erro de conexão ao buscar perfil.'))
        .finally(() => setIsLoadingProfile(false));
    }
  }, [candidate]);

  const handleSendAssessment = async () => {
    if (!candidate) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/candidates/${candidate.id}/create-assessment`, { method: 'POST' });
        const data = await response.json();
        if (data.success && data.link) {
            await navigator.clipboard.writeText(data.link);
            alert('Link da avaliação copiado para a área de transferência!');
        } else {
            alert('Não foi possível gerar o link da avaliação.');
        }
    } catch (error) {
        alert('Erro ao gerar o link da avaliação.');
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={!!candidate} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={candidate.avatar_url || ''} />
              <AvatarFallback>{candidate.nome.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{candidate.nome}</DialogTitle>
              <DialogDescription>{candidate.email || 'Sem e-mail'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 py-4">
          <div>
            <h3 className="font-semibold mb-2">Resumo da IA</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[100px]">
              {candidate.resumo_ia || 'Resumo não disponível.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Perfil Comportamental</h3>
            <div className="bg-gray-50 p-3 rounded-md min-h-[100px]">
              {isLoadingProfile && <div className="flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
              {profileError && <div className="text-red-500 text-sm">{profileError}</div>}
              {!isLoadingProfile && !profileError && profile && (
                 <BehavioralProfileChart data={profile} />
              )}
               {!isLoadingProfile && !profileError && !profile && (
                 <div className="text-center">
                    <p className="text-sm text-gray-500">Nenhum perfil comportamental encontrado.</p>
                    <Button size="sm" className="mt-2" onClick={handleSendAssessment}>
                        Enviar Teste de Perfil
                    </Button>
                 </div>
               )}
            </div>
          </div>
        </div>
        <DialogFooter>
            {candidate.curriculo && candidate.curriculo.length > 0 && (
                <Button asChild variant="outline">
                    <a href={candidate.curriculo[0].url} target="_blank" rel="noopener noreferrer">
                        Ver Currículo
                    </a>
                </Button>
            )}
            <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailModal;