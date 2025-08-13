// Local: src/App.tsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './features/auth/hooks/useAuth';
import { AuthProvider } from './features/auth/context/AuthContext';
import LoginPage from './features/auth/components/LoginPage';
import SignUpPage from './features/auth/components/SignUpPage';
import MainLayout from './shared/components/Layout/MainLayout';
import DashboardPage from './features/dashboard/components/DashboardPage';
import NewScreeningPage from './features/screening/components/NewScreeningPage';
import EditScreeningPage from './features/screening/components/EditScreeningPage';
import ResultsPage from './features/results/components/ResultsPage';
import SettingsPage from './features/settings/components/SettingsPage';
import { LoginCredentials, SignUpCredentials } from './features/auth/types';
import { JobPosting } from './features/screening/types';
import { Loader2 } from 'lucide-react';
import CandidateDatabasePage from './features/database/components/CandidateDatabasePage';
import AgendaPage from './features/agenda/components/AgendaPage';
import AssessmentPage from './features/assessment/AssessmentPage';
import AssessmentResultPage from './features/assessment/AssessmentResultPage';
import { useDataStore } from './shared/store/useDataStore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageKey } from './shared/types';

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
      <h2 className="mt-6 text-xl font-semibold text-gray-800">Carregando...</h2>
      <p className="mt-2 text-gray-500">Estamos preparando tudo para você.</p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
    const { profile, isAuthenticated, isLoading: isAuthLoading, signOut } = useAuth();
    const { jobs, candidates, isDataLoading, fetchAllData } = useDataStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Estado para manter a vaga selecionada entre as navegações
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    useEffect(() => {
        if (isAuthenticated && profile) {
            fetchAllData(profile);
        }
    }, [isAuthenticated, profile, fetchAllData]);

    const handleViewResults = (job: JobPosting) => {
        setSelectedJob(job);
        navigate('/results');
    };

    const handleEditJob = (job: JobPosting) => {
        setSelectedJob(job);
        navigate('/edit-screening');
    };

    const handleJobCreated = (newJob: JobPosting) => {
        useDataStore.getState().addJob(newJob);
        setSelectedJob(newJob);
        navigate('/results');
    };

    const handleJobUpdated = () => {
        fetchAllData(profile!); // Atualiza os dados para refletir a mudança
        navigate('/dashboard');
    };

    const handleDeleteJob = async (jobId: number) => {
        try {
            await useDataStore.getState().deleteJobById(jobId);
        } catch (error) {
            alert("Não foi possível excluir a vaga.");
        }
    };
    
    const handleLogout = () => {
        signOut();
        // A navegação será tratada pelo componente AppContent
    };

    const pageKey = (location.pathname.substring(1) || 'dashboard') as PageKey;
    
    // Se não estiver autenticado, o componente AppContent redirecionará para /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (isAuthLoading || (isAuthenticated && isDataLoading)) {
        return <LoadingSpinner />;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <MainLayout currentPage={pageKey} user={profile} onNavigate={(page) => navigate(`/${page}`)} onLogout={handleLogout}>
                <Routes>
                    <Route path="/dashboard" element={<DashboardPage jobs={jobs} candidates={candidates} onViewResults={handleViewResults} onDeleteJob={handleDeleteJob} onNavigate={(page) => navigate(`/${page}`)} onEditJob={handleEditJob} />} />
                    <Route path="/new-screening" element={<NewScreeningPage onJobCreated={handleJobCreated} onCancel={() => navigate('/dashboard')} />} />
                    <Route path="/edit-screening" element={selectedJob ? <EditScreeningPage jobToEdit={selectedJob} onJobUpdated={handleJobUpdated} onCancel={() => navigate('/dashboard')} /> : <Navigate to="/dashboard" />} />
                    <Route path="/results" element={<ResultsPage selectedJob={selectedJob} candidates={candidates} onDataSynced={() => profile && fetchAllData(profile)} />} />
                    <Route path="/database" element={<CandidateDatabasePage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </MainLayout>
        </DndProvider>
    );
};

function AuthRoutes() {
    const { signIn, signUp, isLoading, error } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (credentials: LoginCredentials) => {
        const success = await signIn(credentials);
        if (success) {
            navigate('/dashboard');
        }
    };

    const handleSignUp = async (credentials: SignUpCredentials) => {
        const newUser = await signUp(credentials);
        if (newUser) {
            await handleLogin({ email: credentials.email, password: credentials.password });
        }
    };

    return (
        <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} onNavigateSignUp={() => navigate('/signup')} isLoading={isLoading} error={error} />} />
            <Route path="/signup" element={<SignUpPage onSignUp={handleSignUp} onNavigateLogin={() => navigate('/login')} isLoading={isLoading} error={error} />} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return isAuthenticated ? <AppRoutes /> : <AuthRoutes />;
}

function App() {
    return (
        <div className="font-inter antialiased">
            <Router>
                <AuthProvider>
                    <Routes>
                        <Route path="/assessment/:token" element={<AssessmentPage />} />
                        <Route path="/assessment/result/:assessmentId" element={<AssessmentResultPage />} />
                        <Route path="/*" element={<AppContent />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;