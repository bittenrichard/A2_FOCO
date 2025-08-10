// Local: src/shared/hooks/useGoogleAuth.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { UserProfile } from '../../features/auth/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasGoogleToken = (profile: UserProfile | null): boolean => {
  return !!profile && !!profile.google_refresh_token;
};

export const useGoogleAuth = () => {
  const { profile, updateProfile, refetchProfile } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(hasGoogleToken(profile));
  
  const isConnecting = useRef(false);

  useEffect(() => {
    setIsGoogleConnected(hasGoogleToken(profile));
  }, [profile]);
  
  useEffect(() => {
    const handleFocus = () => {
      if (isConnecting.current) {
        console.log("[useGoogleAuth] Janela principal recuperou o foco. Verificando status da conexão...");
        refetchProfile();
        isConnecting.current = false;
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchProfile]);

  const connectGoogleCalendar = useCallback(async () => {
    if (!profile) {
      alert('Você precisa estar logado para conectar sua agenda.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/google/auth/connect?userId=${profile.id}`);

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Resposta inesperada do servidor:", textResponse);
        throw new Error('Falha ao obter URL de autenticação.');
      }
      
      const { url } = await response.json();
      
      if (url) {
        isConnecting.current = true;
        window.open(url, '_blank', 'width=600,height=700,noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão com Google:', error);
      alert('Não foi possível iniciar a conexão com o Google Calendar. Tente novamente.');
    }
  }, [profile]);

  const disconnectGoogleCalendar = useCallback(async () => {
    if (!profile) return;
    try {
      await fetch(`${API_BASE_URL}/api/google/auth/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const updatedProfile = { ...profile, google_refresh_token: null };
      updateProfile(updatedProfile);
    } catch (error) {
      console.error('Erro ao desconectar do Google:', error);
      alert('Não foi possível desconectar a conta do Google.');
    }
  }, [profile, updateProfile]);

  return {
    isGoogleConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
};