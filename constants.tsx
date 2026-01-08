import { OSStatus, Priority } from './types';

export const STATUS_CONFIG: Record<OSStatus, { label: string; color: string }> = {
  [OSStatus.RECEPTION]: { label: 'Recepção', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  [OSStatus.BUDGET]: { label: 'Montagem de Orçamento', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  [OSStatus.APPROVAL]: { label: 'Aprovação do Cliente', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  [OSStatus.SCHEDULED]: { label: 'Agendado Montagem', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  [OSStatus.EXECUTION]: { label: 'Em Execução', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  [OSStatus.FINISHED]: { label: 'Finalizado (Qualidade)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; border: string; bg: string }> = {
  [Priority.LOW]: { label: 'Baixa Prioridade', color: 'text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-100' },
  [Priority.MEDIUM]: { label: 'Média Prioridade', color: 'text-amber-700', border: 'border-amber-300', bg: 'bg-amber-100' },
  [Priority.HIGH]: { label: 'Alta Prioridade', color: 'text-red-700', border: 'border-red-300', bg: 'bg-red-100' },
};

export const APP_VERSION = '2026.01.0001';
