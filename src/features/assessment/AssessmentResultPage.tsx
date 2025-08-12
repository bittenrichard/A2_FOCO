// Local: src/features/assessment/AssessmentResultPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, BrainCircuit, Star, Zap, ShieldAlert, CheckCircle, TrendingUp, TrendingDown, Users, CheckSquare } from 'lucide-react';
import BehavioralProfileChart from '../results/components/BehavioralProfileChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AnaliseIA {
  perfil_principal: string;
  perfil_secundario: string;
  resumo_comportamental: string;
  pontos_fortes_contextuais: string[];
  pontos_de_atencao: string[];
  subcaracteristicas?: string[]; // NOVO
  indicadores_situacionais?: { // NOVO
      exigencia_meio: string;
      aproveitamento: string;
      autoconfianca: string;
  };
  error?: string;
}

interface ProfileResult {
  executor: number;
  comunicador: number;
  planejador: number;
  analista: number;
  analise_ia: string | null;
}

const AssessmentResultPage: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const [result, setResult] = useState<ProfileResult | null>(null);
    const [parsedAIResult, setParsedAIResult] = useState<AnaliseIA | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchResult = async () => {
        if (!result) setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/assessment/result/${assessmentId}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Não foi possível carregar o resultado.');
            }
            const data = await response.json();
            const profileData = data.result as ProfileResult;
            setResult(profileData);
            
            let aiAnalysisComplete = false;
            if (profileData.analise_ia) {
                try {
                    const parsed = JSON.parse(profileData.analise_ia);
                    setParsedAIResult(parsed);
                    aiAnalysisComplete = true;
                } catch (e) { console.error("Análise da IA não é um JSON válido:", profileData.analise_ia); }
            }
            if (aiAnalysisComplete) { setIsPolling(false); }
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setIsPolling(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResult();
        intervalRef.current = setInterval(() => {
            setIsPolling(currentIsPolling => {
                if (currentIsPolling) fetchResult();
                return currentIsPolling;
            });
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [assessmentId]);

    useEffect(() => {
        if (!isPolling && intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, [isPolling]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <h2 className="mt-4 text-xl font-semibold text-gray-700">Analisando suas respostas...</h2>
            </div>
        );
    }
    
    if (error || !result) { return <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><p className="text-red-500">{error || 'Resultado não encontrado.'}</p></div>; }

    const profileNameMapping: { [key: string]: { color: string, icon: React.FC<any> } } = {
        Executor: { color: 'text-red-600', icon: Zap },
        Comunicador: { color: 'text-yellow-600', icon: Users },
        Planejador: { color: 'text-green-600', icon: CheckSquare },
        Analista: { color: 'text-blue-600', icon: BrainCircuit },
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
                <div className="text-center border-b pb-8 mb-8">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h1 className="text-4xl font-extrabold text-gray-800 mt-4">Sua Análise Comportamental</h1>
                    <p className="text-lg text-gray-500 mt-2">Veja como seus traços se manifestam no ambiente de trabalho.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                    <div className="md:col-span-2">
                        <BehavioralProfileChart profileData={result} />
                    </div>
                    <div className="md:col-span-3 text-center md:text-left">
                        {parsedAIResult && !parsedAIResult.error ? (
                            <>
                                {(() => {
                                    const mainProfile = parsedAIResult.perfil_principal;
                                    const Icon = profileNameMapping[mainProfile]?.icon || BrainCircuit;
                                    const color = profileNameMapping[mainProfile]?.color || 'text-gray-600';
                                    return (
                                        <>
                                            <p className="text-sm font-semibold text-gray-500">SEU PERFIL DOMINANTE É</p>
                                            <h2 className={`text-4xl font-bold flex items-center justify-center md:justify-start gap-3 ${color}`}>
                                                <Icon size={36} /> {mainProfile}
                                            </h2>
                                            <p className="text-md font-medium text-gray-500 mt-1">com influência de <span className="font-bold">{parsedAIResult.perfil_secundario}</span></p>
                                        </>
                                    );
                                })()}
                                <p className="text-gray-700 mt-4 leading-relaxed bg-gray-50 p-4 rounded-lg border">{parsedAIResult.resumo_comportamental}</p>
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

                {parsedAIResult && !parsedAIResult.error && (
                    <>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><TrendingUp className="h-6 w-6 text-green-500 mr-2" />Pontos Fortes</h4>
                                <ul className="space-y-3">
                                    {parsedAIResult.pontos_fortes_contextuais.map((point, index) => (
                                        <li key={index} className="flex items-start"><Star className="h-5 w-5 text-yellow-400 mr-3 mt-1 flex-shrink-0" /><span className="text-gray-600">{point}</span></li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><TrendingDown className="h-6 w-6 text-orange-500 mr-2" />Pontos de Atenção</h4>
                                <ul className="space-y-3">
                                    {parsedAIResult.pontos_de_atencao.map((point, index) => (
                                        <li key={index} className="flex items-start"><ShieldAlert className="h-5 w-5 text-orange-400 mr-3 mt-1 flex-shrink-0" /><span className="text-gray-600">{point}</span></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                )}
                 <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500">Você já pode fechar esta página. O recrutador foi notificado.</p>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResultPage;