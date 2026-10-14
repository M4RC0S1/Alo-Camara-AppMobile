import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, fmtDate, setToken, type ApiUser, type Chamado, type Status } from '@/services/api';

export type RequestItem = {
  id: string; // protocolo (ex.: AL20260001)
  chamadoId: number; // id na API, usado nas rotas
  type: string;
  title: string;
  address: string;
  description: string;
  date: string;
  status: Status;
};

type AppContextValue = {
  user: ApiUser | null;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (name: string, email: string, password: string) => Promise<ApiUser>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  logout: () => void;
  dark: boolean;
  setDark: (value: boolean) => void;
  requests: RequestItem[];
  refreshRequests: () => Promise<void>;
  addRequest: (item: { type: string; title: string; address: string; description: string }) => Promise<string>;
};

const AppContext = createContext<AppContextValue | null>(null);

export const toRequest = (c: Chamado): RequestItem => ({
  id: c.protocolo,
  chamadoId: c.id,
  type: c.tipo,
  title: c.titulo,
  address: c.endereco,
  description: c.descricao,
  date: fmtDate(c.created_at),
  status: c.status,
});

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [dark, setDark] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const refreshRequests = useCallback(async () => {
    try {
      setRequests((await api.chamados()).map(toRequest));
    } catch {
      // sem conexão/sessão: mantém a lista atual; as telas mostram erros nas ações do usuário
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'user') refreshRequests();
    else setRequests([]);
  }, [user?.id, user?.role, refreshRequests]);

  const start = (r: { token: string; user: ApiUser }) => {
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const login = async (email: string, password: string) => start(await api.login(email.trim(), password));
  const register = async (name: string, email: string, password: string) => start(await api.register(name.trim(), email.trim(), password));
  const logout = () => {
    setToken(null);
    setUser(null);
  };
  const updateProfile = async (data: { name?: string; email?: string }) => setUser(await api.updateMe(data));

  const addRequest = async (item: { type: string; title: string; address: string; description: string }) => {
    const c = await api.criarChamado({ tipo: item.type, titulo: item.title, endereco: item.address, descricao: item.description });
    await refreshRequests();
    return c.protocolo;
  };

  const value = useMemo(
    () => ({ user, login, register, updateProfile, logout, dark, setDark, requests, refreshRequests, addRequest }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, dark, requests, refreshRequests],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de AppProvider');
  return ctx;
}
