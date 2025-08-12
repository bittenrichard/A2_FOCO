// Local: src/features/assessment/AssessmentResultPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, BrainCircuit, Star, Zap, ShieldAlert, CheckCircle, TrendingUp, TrendingDown, Users, CheckSquare, Target } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AnaliseIA {
  perfil_principal: string;
  perfil_secundario: string;
  resumo_comportamental: string;
  subcaracteristicas: string[];
  pontos_fortes_contextuais: string[];
  pontos_de_atencao: string[];
  indicadores_situacionais: {
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
  analise_ia: AnaliseIA | null;
}

const ProfileBar: React.FC<{ name: string; value: number; color: string; icon: React.FC<any> }> = ({ name, value, color, icon: Icon }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
                <Icon className={`w-4 h-4 mr-2 ${color}`} />
                <span className="text-sm font-semibold text-gray-700">{name}</span>
            </div>
            <span className={`text-sm font-bold ${color}`}>{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${color.replace('text-', 'bg-').replace('-600', '-500')} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);


const AssessmentResultPage: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const [result, setResult] = useState<ProfileResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchResult = useCallback(async () => {
        if (!result) setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/assessment/result/${assessmentId}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Não foi possível carregar o resultado.');
            }
            const data = await response.json();
            setResult(data.result);
            if (data.result?.analise_ia) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
            if (intervalRef.current) clearInterval(intervalRef.current);
        } finally {
            setIsLoading(false);
        }
    }, [assessmentId, result]);

    useEffect(() => {
        fetchResult();
        intervalRef.current = setInterval(fetchResult, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchResult]);

    if (isLoading && !result) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <h2 className="mt-4 text-xl font-semibold text-gray-700">Analisando suas respostas...</h2>
            </div>
        );
    }
    
    if (error || !result) { return <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><p className="text-red-500">{error || 'Resultado não encontrado.'}</p></div>; }

    const profileStyles: { [key: string]: { color: string; icon: React.FC<any> } } = {
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 items-center">
                    <div className="space-y-4">
                        <ProfileBar name="Executor" value={result.executor || 0} color="text-red-600" icon={Zap} />
                        <ProfileBar name="Comunicador" value={result.comunicador || 0} color="text-yellow-600" icon={Users} />
                        <ProfileBar name="Planejador" value={result.planejador || 0} color="text-green-600" icon={CheckSquare} />
                        <ProfileBar name="Analista" value={result.analista || 0} color="text-blue-600" icon={BrainCircuit} />
                    </div>
                     <div className="text-center md:text-left">
                        {result.analise_ia && !result.analise_ia.error ? (
                            <>
                                {(() => {
                                    const mainProfile = result.analise_ia!.perfil_principal;
                                    const Icon = profileStyles[mainProfile]?.icon || BrainCircuit;
                                    const color = profileStyles[mainProfile]?.color || 'text-gray-600';
                                    return (
                                        <>
                                            <p className="text-sm font-semibold text-gray-500">SEU PERFIL DOMINANTE É</p>
                                            <h2 className={`text-4xl font-bold flex items-center justify-center md:justify-start gap-3 ${color}`}>
                                                <Icon size={36} /> {mainProfile}
                                            </h2>
                                            <p className="text-md font-medium text-gray-500 mt-1">com influência de <span className="font-bold">{result.analise_ia!.perfil_secundario}</span></p>
                                        </>
                                    );
                                })()}
                                <p className="text-gray-700 mt-4 leading-relaxed bg-gray-50 p-4 rounded-lg border">{result.analise_ia!.resumo_comportamental}</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg">
                                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                                <p className="mt-3 font-semibold text-gray-600">A análise da IA está sendo gerada...</p>
                                <p className="mt-1 text-sm text-gray-500">Isso pode levar alguns instantes.</p>
                            </div>
                        )}
                    </div>
                </div>

                {result.analise_ia && !result.analise_ia.error && (
                    <>
                        <div className="mt-12">
                             <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><Star className="h-6 w-6 text-indigo-500 mr-2" />Subcaracterísticas</h4>
                             <div className="flex flex-wrap gap-3">
                                {result.analise_ia.subcaracteristicas.map((item, index) => (
                                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">{item}</span>
                                ))}
                             </div>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><TrendingUp className="h-6 w-6 text-green-500 mr-2" />Pontos Fortes</h4>
                                <ul className="space-y-3">
                                    {result.analise_ia.pontos_fortes_contextuais.map((point, index) => (
                                        <li key={index} className="flex items-start"><CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-1 flex-shrink-0" /><span className="text-gray-600">{point}</span></li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><TrendingDown className="h-6 w-6 text-orange-500 mr-2" />Pontos de Atenção</h4>
                                <ul className="space-y-3">
                                    {result.analise_ia.pontos_de_atencao.map((point, index) => (
                                        <li key={index} className="flex items-start"><ShieldAlert className="h-5 w-5 text-orange-400 mr-3 mt-1 flex-shrink-0" /><span className="text-gray-600">{point}</span></li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12">
                             <h4 className="flex items-center text-xl font-semibold text-gray-800 mb-4"><Target className="h-6 w-6 text-gray-500 mr-2" />Indicadores Situacionais</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="font-semibold text-gray-700">Exigência do Meio</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">{result.analise_ia.indicadores_situacionais.exigencia_meio}</p>
                                </div>
                                 <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="font-semibold text-gray-700">Aproveitamento</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">{result.analise_ia.indicadores_situacionais.aproveitamento}</p>
                                </div>
                                 <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="font-semibold text-gray-700">Autoconfiança</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">{result.analise_ia.indicadores_situacionais.autoconfianca}</p>
                                </div>
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