// Local: src/shared/types/index.ts

export type PageKey = 'login' | 'signup' | 'dashboard' | 'new-screening' | 'edit-screening' | 'results' | 'settings' | 'database' | 'agenda';

export interface Candidate {
  id: number;
  order: string;
  nome: string;
  email?: string;
  telefone: string | null;
  score: number | null;
  resumo_ia: string | null;
  data_triagem: string;
  vaga: { id: number; value: string }[] | null;
  usuario: { id: number; value: string }[] | null;
  curriculo?: { url: string; name: string }[] | null;
  
  cidade?: string;
  bairro?: string;
  idade?: number;
  sexo?: string;
  escolaridade?: string;
  status?: { id: number; value: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado' } | null;
  
  // --- CAMPO ADICIONADO ---
  perfil_comportamental?: string | null;
}