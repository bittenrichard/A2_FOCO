// Local: src/App.tsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/hooks/useAuth';
import { AuthProvider } from './features/auth/context/AuthContext'; // <-- CORREÇÃO: IMPORTAÇÃO ADICIONADA
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
import { useDataStore } from './shared/store/useDataStore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageKey } from './shared/types';

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><div className="text-center"><Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" /><h2 className="mt-6 text-xl font-semibold text-gray-800">Carregando...</h2><p className="mt-2 text-gray-500">Estamos preparando tudo para você.</p></div></div>
);

const AppRoutes: React.FC = () => {
    const { profile, isAuthenticated, isLoading: isAuthLoading, error: authError, signIn, signOut, signUp } = useAuth();
    const { jobs, candidates, isDataLoading, fetchAllData } = useDataStore();
    const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    useEffect(() => {
        if (isAuthenticated && profile) {
            fetchAllData(profile);
        }
    }, [isAuthenticated, profile, fetchAllData]);

    const handleLogin = async (credentials: LoginCredentials) => {
        await signIn(credentials);
    };

    const handleSignUp = async (credentials: SignUpCredentials) => {
        const newUser = await signUp(credentials);
        if (newUser) {
            await handleLogin({ email: credentials.email, password: credentials.password });
        }
    };

    const handleLogout = () => {
        signOut();
    };

    const handleViewResults = (job: JobPosting) => {
        setSelectedJob(job);
        setCurrentPage('results');
    };

    const handleEditJob = (job: JobPosting) => {
        setSelectedJob(job);
        setCurrentPage('edit-screening');
    };

    const handleJobCreated = (newJob: JobPosting) => {
        useDataStore.getState().addJob(newJob);
        setSelectedJob(newJob);
        setCurrentPage('results');
    };

    const handleJobUpdated = () => {
        setCurrentPage('dashboard');
    };

    const handleDeleteJob = async (jobId: number) => {
        try {
            await useDataStore.getState().deleteJobById(jobId);
        } catch (error) {
            alert("Não foi possível excluir a vaga.");
        }
    };

    if (isAuthLoading || (isAuthenticated && isDataLoading)) return <LoadingSpinner />;

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} onNavigateSignUp={() => {}} isLoading={isAuthLoading} error={authError} />} />
                <Route path="/signup" element={<SignUpPage onSignUp={handleSignUp} onNavigateLogin={() => {}} isLoading={isAuthLoading} error={authError} />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    // Simulação de navegação interna sem recarregar a página
    const renderContent = () => {
        const path = window.location.pathname;
        if (path === '/new-screening') setCurrentPage('new-screening');
        // Adicionar outras lógicas de rota se necessário
        
        switch (currentPage) {
            case 'dashboard': return <DashboardPage jobs={jobs} candidates={candidates} onViewResults={handleViewResults} onDeleteJob={handleDeleteJob} onNavigate={setCurrentPage} onEditJob={handleEditJob} />;
            case 'new-screening': return <NewScreeningPage onJobCreated={handleJobCreated} onCancel={() => setCurrentPage('dashboard')} />;
            case 'edit-screening': return selectedJob ? <EditScreeningPage jobToEdit={selectedJob} onJobUpdated={handleJobUpdated} onCancel={() => setCurrentPage('dashboard')} /> : <DashboardPage jobs={jobs} candidates={candidates} onViewResults={handleViewResults} onDeleteJob={handleDeleteJob} onNavigate={setCurrentPage} onEditJob={handleEditJob} />;
            case 'results': return <ResultsPage selectedJob={selectedJob} candidates={candidates} onDataSynced={() => fetchAllData(profile!)} />;
            case 'database': return <CandidateDatabasePage />;
            case 'agenda': return <AgendaPage />;
            case 'settings': return <SettingsPage />;
            default: return <DashboardPage jobs={jobs} candidates={candidates} onViewResults={handleViewResults} onDeleteJob={handleDeleteJob} onNavigate={setCurrentPage} onEditJob={handleEditJob} />;
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <MainLayout currentPage={currentPage} user={profile} onNavigate={setCurrentPage} onLogout={handleLogout}>
                {renderContent()}
            </MainLayout>
        </DndProvider>
    );
};

function App() {
    return (
        <div className="font-inter antialiased">
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/assessment/:token" element={<AssessmentPage />} />
                        <Route path="/*" element={<AppRoutes />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </div>
    );
}

export default App;