// Local: src/features/assessment/AssessmentResultPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, BrainCircuit, Star, Zap, ShieldAlert, CheckCircle } from 'lucide-react';
import BehavioralProfileChart from '../results/components/BehavioralProfileChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ProfileResult {
  executor: number;
  comunicador: number;
  planejador: number;
  analista: number;
  analise_ia: {
    perfil_principal: string;
    perfil_secundario: string;
    resumo_comportamental: string;
    pontos_fortes_contextuais: string[];
    pontos_de_atencao: string[];
    error?: string; // Para o caso de falha da IA
  } | null;
}

const AssessmentResultPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assessment/result/${assessmentId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar o resultado.');
        }
        setResult(data.result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Tenta buscar o resultado imediatamente e depois a cada 5 segundos se a análise da IA não estiver pronta
    fetchResult();
    const interval = setInterval(() => {
        setResult(prevResult => {
            if (prevResult && !prevResult.analise_ia) {
                fetchResult();
            }
            return prevResult;
        });
    }, 5000);

    // Limpa o intervalo quando o componente é desmontado ou quando a análise chega
    return () => {
        clearInterval(interval);
    };
  }, [assessmentId]);

  useEffect(() => {
      if(result && result.analise_ia) {
          // Para o polling quando a analise_ia estiver presente
          // (a lógica no return do primeiro useEffect já faz isso, mas é uma segurança extra)
      }
  }, [result]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Buscando seu resultado...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500">{error || 'Resultado não encontrado.'}</p>
      </div>
    );
  }
  
  const { analise_ia } = result;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center border-b pb-6 mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-4xl font-bold text-gray-800 mt-4">Sua Avaliação foi Concluída!</h1>
          <p className="text-lg text-gray-600 mt-2">Confira abaixo a análise do seu perfil comportamental.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <BehavioralProfileChart profileData={result} />
          </div>
          <div className="text-center md:text-left">
            {analise_ia && !analise_ia.error ? (
                <>
                    <h3 className="text-2xl font-bold text-gray-800">Perfil Principal</h3>
                    <p className="text-3xl font-extrabold text-indigo-600 mt-1">{analise_ia.perfil_principal}</p>
                     <p className="text-lg font-semibold text-gray-500 mt-1">com influência de {analise_ia.perfil_secundario}</p>
                    <p className="text-gray-700 mt-4 leading-relaxed">{analise_ia.resumo_comportamental}</p>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    <p className="mt-3 font-semibold text-gray-600">A análise da IA está sendo gerada...</p>
                    <p className="mt-1 text-sm text-gray-500">Isso pode levar alguns instantes. A página será atualizada automaticamente.</p>
                </div>
            )}
          </div>
        </div>

        {analise_ia && !analise_ia.error && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4">
                <Zap className="h-6 w-6 text-green-500 mr-2" />
                Pontos Fortes Contextuais
                </h4>
                <ul className="space-y-3">
                {analise_ia.pontos_fortes_contextuais.map((point, index) => (
                    <li key={index} className="flex items-start">
                    <Star className="h-5 w-5 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                    </li>
                ))}
                </ul>
            </div>
            <div>
                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4">
                <ShieldAlert className="h-6 w-6 text-orange-500 mr-2" />
                Pontos de Atenção
                </h4>
                <ul className="space-y-3">
                {analise_ia.pontos_de_atencao.map((point, index) => (
                    <li key={index} className="flex items-start">
                    <BrainCircuit className="h-5 w-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                    </li>
                ))}
                </ul>
            </div>
            </div>
        )}
         <div className="mt-12 text-center">
            <p className="text-gray-500">Você já pode fechar esta página. O recrutador foi notificado.</p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResultPage;