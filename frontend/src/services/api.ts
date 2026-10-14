import Constants from 'expo-constants';
import { Platform } from 'react-native';

// URL da API: EXPO_PUBLIC_API_URL tem prioridade; senão usa o IP da máquina que serve o Expo
// (funciona no celular/Expo Go), e por fim localhost (web) ou 10.0.2.2 (emulador Android).
export function apiBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3333`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalhe = Array.isArray(data.detalhes) && data.detalhes.length ? `: ${data.detalhes.map((d: { mensagem: string }) => d.mensagem).join('; ')}` : '';
    throw new ApiError(res.status, (data.error ?? 'Erro inesperado') + detalhe);
  }
  return data as T;
}

const get = <T>(p: string) => request<T>('GET', p);
const send = <T>(m: string, p: string, b?: unknown) => request<T>(m, p, b ?? {});

export type ApiUser = { id: number; name: string; email: string; role: 'user' | 'admin' };
export type Status = 'Em análise' | 'Respondido' | 'Concluído';
export type Chamado = { id: number; protocolo: string; tipo: string; titulo: string; endereco: string; descricao: string; status: Status; created_at: string; cidadao: string };
export type Resposta = { id: number; mensagem: string; created_at: string; autor: string | null };
export type Politico = { id: number; nome: string; partido: string; regiao: string | null; bio: string | null; email: string | null; telefone: string | null; media: number | null; total_avaliacoes: number };
export type Avaliacao = { id: number; nota: number; comentario: string | null; created_at: string; autor: string };
export type Evento = { id: number; titulo: string; descricao: string | null; tipo: 'Sessão' | 'Audiência' | 'Comissão'; local: string | null; participantes: number; data_hora: string };
export type Notificacao = { id: number; tipo: 'PROTOCOLO' | 'AVISO'; titulo: string; mensagem: string; lida: 0 | 1; created_at: string };

export const api = {
  login: (email: string, password: string) => send<{ token: string; user: ApiUser }>('POST', '/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => send<{ token: string; user: ApiUser }>('POST', '/auth/register', { name, email, password }),
  updateMe: (data: { name?: string; email?: string }) => send<ApiUser>('PATCH', '/auth/me', data),

  chamados: () => get<Chamado[]>('/chamados'),
  chamado: (id: number | string) => get<Chamado & { respostas: Resposta[] }>(`/chamados/${id}`),
  criarChamado: (d: { tipo: string; titulo: string; endereco: string; descricao: string }) => send<Chamado>('POST', '/chamados', d),
  responder: (id: number, mensagem: string, status?: Status) => send<Chamado>('POST', `/chamados/${id}/respostas`, { mensagem, status }),
  mudarStatus: (id: number, status: Status) => send<Chamado>('PATCH', `/chamados/${id}/status`, { status }),

  politicos: () => get<Politico[]>('/politicos'),
  politico: (id: number | string) => get<Politico & { avaliacoes: Avaliacao[] }>(`/politicos/${id}`),
  avaliar: (id: number | string, nota: number, comentario?: string) => send<Politico>('PUT', `/politicos/${id}/avaliacao`, { nota, comentario }),

  eventos: () => get<Evento[]>('/eventos'),

  notificacoes: () => get<Notificacao[]>('/notificacoes'),
  marcarLida: (id: number) => send<void>('PATCH', `/notificacoes/${id}/lida`),
  marcarTodasLidas: () => send<{ atualizadas: number }>('POST', '/notificacoes/marcar-todas-lidas'),
};

// "2026-02-24 10:30:00" (MySQL) -> "24 de fev. de 2026"
export const fmtDate = (s: string) => new Date(s.replace(' ', 'T')).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');

export const timeAgo = (s: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(s.replace(' ', 'T')).getTime()) / 60000));
  if (mins < 60) return `há ${mins} min`;
  if (mins < 60 * 24) return `há ${Math.floor(mins / 60)} h`;
  return `há ${Math.floor(mins / 1440)} dias`;
};
