// Local: src/features/database/components/CandidateDatabasePage.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { useDataStore } from '../../../shared/store/useDataStore';
import { Candidate } from '../../../shared/types';
import { Input } from '../../../shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '../../../shared/components/ui/avatar';
import { Badge } from '../../../shared/components/ui/badge';
import CandidateDetailModal from '../../results/components/CandidateDetailModal';
import { useAuth } from '../../auth/hooks/useAuth';

const CandidateDatabasePage: React.FC = () => {
    const { profile } = useAuth();
    const { candidates, fetchAllData, isDataLoading } = useDataStore((state) => ({
        candidates: state.candidates,
        fetchAllData: state.fetchAllData,
        isDataLoading: state.isDataLoading,
    }));
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    useEffect(() => {
        if (profile) {
            fetchAllData(profile);
        }
    }, [profile, fetchAllData]);

    const filteredCandidates = useMemo(() => {
        return candidates.filter(candidate =>
            candidate.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (candidate.email && candidate.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [candidates, searchTerm]);

    const handleViewDetails = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
    };

    if (isDataLoading) {
        return <div className="p-6">Carregando banco de dados de candidatos...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Banco de Candidatos</h1>
            <div className="mb-4">
                <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidato</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vaga Associada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates.length > 0 ? (
                            filteredCandidates.map((candidate) => (
                                <TableRow key={candidate.id} onClick={() => handleViewDetails(candidate)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={candidate.avatar_url || ''} alt={candidate.nome} />
                                                <AvatarFallback>{candidate.nome.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4">
                                                <div className="font-medium">{candidate.nome}</div>
                                                <div className="text-sm text-muted-foreground">Score: {candidate.score || 'N/A'}%</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{candidate.email || 'Não informado'}</div>
                                        <div className="text-sm text-muted-foreground">{candidate.telefone || 'Não informado'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={candidate.status === 'Aprovado' ? 'default' : 'secondary'}>
                                            {candidate.status || 'Não definido'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.vaga && candidate.vaga.length > 0 ? candidate.vaga[0].value : 'Nenhuma'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhum candidato encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onScheduleInterview={() => { /* Não aplicável aqui */ }}
                    onUpdateStatus={() => { /* Não aplicável aqui */ }}
                />
            )}
        </div>
    );
};

export default CandidateDatabasePage;