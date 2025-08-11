// Local: src/features/assessment/AssessmentPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AssessmentPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [adjectives, setAdjectives] = useState<string[]>([]);
  const [selections, setSelections] = useState<{ [key: number]: string[] }>({ 1: [], 2: [], 3: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assessment/${token}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAdjectives(data.adjectives);
        setAssessmentId(data.assessmentId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessmentData();
  }, [token]);

  // CORREÇÃO DE UX: Rola para o topo a cada mudança de passo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleSelect = (adjective: string) => {
    const currentStep = step + 1;
    const currentSelection = selections[currentStep] || [];
    if (currentSelection.includes(adjective)) {
      setSelections({ ...selections, [currentStep]: currentSelection.filter(item => item !== adjective) });
    } else {
      setSelections({ ...selections, [currentStep]: [...currentSelection, adjective] });
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessment/${assessmentId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                passo1: selections[1],
                passo2: selections[2],
                passo3: selections[3],
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // Manda para a página de resultado ao finalizar
        navigate(`/assessment/result/${assessmentId}`);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando avaliação...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  const stepsContent = [
    { title: "Passo 1 de 3", instruction: "Marque os adjetivos que descrevem como você é (personalidade)." },
    { title: "Passo 2 de 3", instruction: "Marque os adjetivos que melhor te representam (motivação)." },
    { title: "Passo 3 de 3", instruction: "Agora, na sua percepção, marque como os outros pensam que você deveria ser (atributos que você tenha ou não)." }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Perfil Comportamental</h1>
            <span className="font-semibold text-gray-500">{stepsContent[step].title}</span>
        </div>
        <p className="text-gray-600 mb-6">{stepsContent[step].instruction}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {adjectives.map(adjective => {
            const isSelected = selections[step+1]?.includes(adjective);
            return (
              <button
                key={adjective}
                onClick={() => handleSelect(adjective)}
                className={`p-3 text-center rounded-lg border-2 transition-all duration-200 text-sm font-medium
                  ${isSelected
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
              >
                {adjective}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={prevStep} disabled={step === 0} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
            Anterior
          </button>
          {step < 2 ? (
            <button onClick={nextStep} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Próximo
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
              {isLoading ? 'Finalizando...' : 'Finalizar e Ver Resultado'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;