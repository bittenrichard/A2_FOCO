// Local: src/features/results/components/CandidateDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { X, User, Star, Briefcase, FileText, MessageCircle, Download, CalendarPlus, ChevronDown, RefreshCcw, BrainCircuit, Loader2, Send, Copy } from 'lucide-react';
import { Candidate } from '../../../shared/types';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters';
import BehavioralProfileChart from './BehavioralProfileChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, onScheduleInterview, onUpdateStatus }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const [behavioralProfile, setBehavioralProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [assessmentLink, setAssessmentLink] = useState<string | null>(null);
  const [isSendingAssessment, setIsSendingAssessment] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setBehavioralProfile(null);
    setAssessmentLink(null);
    setIsLoadingProfile(true);
    setProfileError(null);
    setLinkCopied(false);

    const fetchBehavioralProfile = async () => {
      if (!candidate) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/candidates/${candidate.id}/behavioral-profile`);
        if (!response.ok) throw new Error('Falha ao buscar o perfil comportamental.');
        const data = await response.json();
        if (data.success) {
          setBehavioralProfile(data.profile);
        } else {
          throw new Error(data.error || 'Erro desconhecido ao buscar perfil.');
        }
      } catch (error: any) {
        setProfileError(error.message);
        console.error("Erro ao buscar perfil comportamental:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchBehavioralProfile();
  }, [candidate]);
  
  const handleSendAssessment = async () => {
    if (!candidate) return;
    setIsSendingAssessment(true);
    setAssessmentLink(null);
    setProfileError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/api/candidates/${candidate.id}/create-assessment`, { method: 'POST' });
        const data = await response.json();
        if(!response.ok) throw new Error(data.error || 'Não foi possível gerar o link.');
        setAssessmentLink(data.link);
    } catch (error: any) {
        setProfileError(error.message);
    } finally {
        setIsSendingAssessment(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (assessmentLink) {
        navigator.clipboard.writeText(assessmentLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (!candidate) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const whatsappNumber = formatPhoneNumberForWhatsApp(candidate.telefone);
  const curriculumAvailable = candidate.curriculo && candidate.curriculo[0];

  const handleStatusChange = (newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => {
    onUpdateStatus(candidate.id, newStatus);
    setShowStatusMenu(false);
  };
  
  const renderBehavioralProfile = () => {
    if (isLoadingProfile) return <div className="flex items-center justify-center p-4 text-gray-500"><Loader2 size={20} className="animate-spin mr-2" /> Verificando perfil...</div>;
    if (profileError) return <p className="text-red-500 text-sm p-4">Não foi possível carregar os dados do perfil.</p>;
    if (!behavioralProfile) {
      return (
        <div className="text-center p-4">
            <p className="text-gray-500 text-sm mb-3">Este candidato ainda não respondeu ao teste de perfil.</p>
            {assessmentLink ? (
                <div className="mt-2">
                    <label className="text-sm font-semibold text-gray-600">Link da Avaliação:</label>
                    <div className="flex items-center mt-1">
                        <input type="text" readOnly value={assessmentLink} className="w-full px-2 py-1 border rounded-l-md bg-gray-100 text-sm" />
                        <button onClick={copyLinkToClipboard} className="px-3 py-1 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 flex items-center gap-2">
                            <Copy size={16} />
                            {linkCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={handleSendAssessment} disabled={isSendingAssessment} className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-md hover:bg-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSendingAssessment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isSendingAssessment ? 'Gerando link...' : 'Enviar Teste de Perfil'}
                </button>
            )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        <BehavioralProfileChart profileData={behavioralProfile} />
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded"><span className="font-semibold text-gray-700">Executor:</span><span className="font-bold text-red-600">{behavioralProfile.executor}%</span></div>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded"><span className="font-semibold text-gray-700">Comunicador:</span><span className="font-bold text-yellow-600">{behavioralProfile.comunicador}%</span></div>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded"><span className="font-semibold text-gray-700">Planejador:</span><span className="font-bold text-green-600">{behavioralProfile.planejador}%</span></div>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded"><span className="font-semibold text-gray-700">Analista:</span><span className="font-bold text-blue-600">{behavioralProfile.analista}%</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">Detalhes do Candidato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center space-x-4"><div className="bg-indigo-100 text-indigo-600 p-3 rounded-full"><User size={32} /></div><div><h3 className="text-2xl font-bold text-gray-900">{candidate.nome}</h3>{candidate.email && (<p className="text-md text-gray-500">{candidate.email}</p>)}{candidate.telefone && (<p className="text-md text-gray-500">{candidate.telefone}</p>)}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Star size={16} className="mr-2" /><span className="text-sm font-semibold">Score de Aderência</span></div><p className={`text-3xl font-bold ${getScoreColor(candidate.score || 0)}`}>{candidate.score || 0}%</p></div><div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Briefcase size={16} className="mr-2" /><span className="text-sm font-semibold">Vaga Aplicada</span></div><p className="text-lg font-semibold text-gray-800">{candidate.vaga && candidate.vaga[0] ? candidate.vaga[0].value : 'Não informada'}</p></div></div>
          <div><div className="flex items-center text-gray-600 mb-2"><FileText size={18} className="mr-2" /><h4 className="text-lg font-bold">Resumo da Inteligência Artificial</h4></div><p className="text-gray-700 bg-gray-50 p-4 rounded-lg border leading-relaxed">{candidate.resumo_ia || "Nenhum resumo disponível."}</p></div>
          <div><div className="flex items-center text-gray-600 mb-2"><BrainCircuit size={18} className="mr-2"/><h4 className="text-lg font-bold">Perfil Comportamental</h4></div><div className="bg-gray-50 rounded-lg border">{renderBehavioralProfile()}</div></div>
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end items-center gap-3">
          <div className="relative w-full sm:w-auto"><button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 w-full" title="Mudar Status"><RefreshCcw size={16} />Status: {candidate.status?.value || 'Triagem'} <ChevronDown size={16} className="ml-1" /></button>{showStatusMenu && (<div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg z-20">{['Triagem', 'Entrevista', 'Aprovado', 'Reprovado'].map((statusOption) => (<button key={statusOption} onClick={() => handleStatusChange(statusOption as 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{statusOption}</button>))}</div>)}</div>
          <a href={curriculumAvailable ? curriculumAvailable.url : undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => !curriculumAvailable && e.preventDefault()} className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${curriculumAvailable ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'} w-full sm:w-auto`} title={curriculumAvailable ? 'Baixar currículo' : 'Currículo não disponível'}><Download size={16} />Currículo</a>
          <a href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md transition-colors ${!whatsappNumber ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'} w-full sm:w-auto`} onClick={(e) => !whatsappNumber && e.preventDefault()} title={whatsappNumber ? 'Chamar no WhatsApp' : 'Telefone não disponível'}><MessageCircle size={18} />Chamar Candidato</a>
        </div>
      </div>
      <style>{`.animate-scale-in { animation: scale-in 0.2s ease-out forwards; } @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

export default CandidateDetailModal;