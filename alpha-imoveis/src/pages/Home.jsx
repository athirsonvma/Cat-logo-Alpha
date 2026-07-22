import React from 'react';
import { Calendar, AlertTriangle, FileText, Users, Activity, TrendingUp, Plus } from 'lucide-react';
import { isLeadActive, isLeadStale, STAGE_CONFIG, ACTIVITY_TYPES } from '../CrmViews.jsx';
import { daysSince, todayStr } from '../helpers.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home({ corretorName, leads, properties, onOpenLead, onNewLead, onNewProperty }) {
  const today = todayStr();
  const active = leads.filter(isLeadActive);
  const dueToday = active.filter(l => l.nextActionDate && l.nextActionDate <= today);
  const stale = active.filter(isLeadStale);
  const propostas = active.filter(l => l.stage === 'proposta');
  const visitas = active.filter(l => l.stage === 'visita');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const fechadosMes = leads.filter(l => l.stage === 'fechado' && (l.updatedAt ? new Date(l.updatedAt).toISOString().slice(0, 7) === thisMonth : false));

  const recentActivity = leads
    .flatMap(l => (l.activity || []).map(a => ({ ...a, leadName: l.name, leadId: l.id })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);

  return (
    <div className="home-dashboard">
      <div className="home-header">
        <div>
          <h1>{greeting()}, {corretorName || 'Corretor'}</h1>
          <p className="muted-small">Aqui está o que precisa da sua atenção hoje.</p>
        </div>
        <div className="home-quick-actions">
          <button className="btn-ghost small" onClick={onNewProperty}><Plus size={14} /> Imóvel</button>
          <button className="btn-primary" onClick={onNewLead}><Plus size={16} /> Lead</button>
        </div>
      </div>

      <div className="home-stats-grid">
        <div className="home-stat-card">
          <span className="home-stat-count">{dueToday.length}</span>
          <span className="home-stat-label"><Calendar size={13} /> Leads do dia</span>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-count">{visitas.length}</span>
          <span className="home-stat-label"><Users size={13} /> Visitas em andamento</span>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-count">{propostas.length}</span>
          <span className="home-stat-label"><FileText size={13} /> Propostas ativas</span>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-count warn">{stale.length}</span>
          <span className="home-stat-label"><AlertTriangle size={13} /> Aguardando retorno</span>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-count accent">{fechadosMes.length}</span>
          <span className="home-stat-label"><TrendingUp size={13} /> Fechados este mês</span>
        </div>
      </div>

      <div className="home-grid">
        <div className="today-card">
          <span className="today-card-title"><Calendar size={14} /> Agenda de hoje / atrasados</span>
          {dueToday.length === 0 ? <p className="empty-hint">Nada pendente — bom sinal.</p> : (
            <div className="today-list">
              {dueToday.slice(0, 6).map(l => (
                <button className="today-row" key={l.id} onClick={() => onOpenLead(l)}>
                  <strong>{l.name}</strong>
                  <span>{l.nextActionText}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="today-card">
          <span className="today-card-title"><AlertTriangle size={14} /> Clientes aguardando retorno</span>
          {stale.length === 0 ? <p className="empty-hint">Ninguém esfriando agora.</p> : (
            <div className="today-list">
              {stale.slice(0, 6).map(l => (
                <button className="today-row" key={l.id} onClick={() => onOpenLead(l)}>
                  <strong>{l.name}</strong>
                  <span>{daysSince(l.lastContactAt || l.createdAt)} dias sem contato · {STAGE_CONFIG[l.stage].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="today-card home-financial-placeholder">
          <span className="today-card-title">Resumo financeiro</span>
          <p className="empty-hint">Em breve — depende de um modelo de comissão por negócio, que ainda não existe no sistema.</p>
        </div>

        <div className="today-card">
          <span className="today-card-title"><Activity size={14} /> Últimas atividades</span>
          {recentActivity.length === 0 ? <p className="empty-hint">Nenhuma atividade registrada ainda.</p> : (
            <div className="activity-log">
              {recentActivity.map(entry => {
                const typeCfg = ACTIVITY_TYPES.find(t => t.value === entry.type) || ACTIVITY_TYPES[4];
                const Icon = typeCfg.Icon;
                return (
                  <div className="activity-entry" key={entry.id}>
                    <span className="activity-icon"><Icon size={13} /></span>
                    <div className="activity-entry-body">
                      <p><strong>{entry.leadName}</strong> — {entry.text}</p>
                      <span>{new Date(entry.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
