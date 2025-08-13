// Local: src/features/screening/components/EditScreeningPage.tsx

import React from 'react';
import JobForm from './JobForm';
import { useAuth } from '../../auth/hooks/useAuth';
import { JobPosting, JobFormData } from '../types';
import { useDataStore } from '../../../shared/store/useDataStore';

interface EditScreeningPageProps {
  jobToEdit: JobPosting;
  onJobUpdated: () => void;
  onCancel: () => void;
}

const EditScreeningPage: React.FC<EditScreeningPageProps> = ({ jobToEdit, onJobUpdated, onCancel }) => {
  const { profile } = useAuth();
  const updateJobById = useDataStore((state) => state.updateJobById);

  const initialValues: JobFormData = {
    titulo: jobToEdit.titulo || '',
    descricao: jobToEdit.descricao || '',
    endereco: jobToEdit.Endereco || '',
    requisitos_obrigatorios: jobToEdit.requisitos_obrigatorios || '',
    requisitos_desejaveis: jobToEdit.requisitos_desejaveis || ''
  };

  const handleUpdateJob = async (formData: JobFormData) => {
    if (!profile) {
      alert("Sessão expirada. Por favor, faça login novamente.");
      return;
    }
    await updateJobById(jobToEdit.id, formData);
    onJobUpdated();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Editar Vaga</h1>
      <JobForm
        initialData={initialValues}
        onSubmit={handleUpdateJob}
        onCancel={onCancel}
        isEditing={true}
      />
    </div>
  );
};

export default EditScreeningPage;