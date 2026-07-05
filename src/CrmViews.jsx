import React, { useState } from 'react';
import {
  X, Plus, Search, Phone, MessageCircle, Home as HomeIcon, FileText, StickyNote,
  Calendar, AlertTriangle, Trash2, UserPlus, ArrowRight, Flame, Snowflake, Sun,
  TrendingUp, Share2
} from 'lucide-react';
import { uid, daysSince, todayStr, normalizePhone, formatPhoneDisplay } from './helpers.js';

export const STAGE_ORDER = ['novo', 'contato', 'visita', 'proposta', 'fechado', 'perdido'];

export const STAGE_CONFIG = {
  novo:     { label: 'Novo',            textColor: '#F2D666', bg: 'rgba(242,214,102,0.14)', dot: '#F2D666', hint: 'Lead entrou, ainda sem contato.' },
  contato:  { label: 'Contato feito',   textColor: '#7FA6FF', bg: 'rgba(91,141,239,0.14)',  dot: '#5B8DEF', hint: 'Primeira conversa realizada.' },
  visita:   { label: 'Visita agendada', textColor: '#5FD6C7', bg: 'rgba(63,191,176,0.14)',  dot: '#3FBFB0', hint: 'Visita marcada ou já realizada.' },
  proposta: { label: 'Proposta',        textColor: '#B79EE8', bg: 'rgba(155,127,212,0.14)', dot: '#9B7FD4', hint: 'Proposta enviada ou em negociação.' },
  fechado:  { label: 'Fechado',         textColor: '#6EE7B7', bg: 'rgba(74,222,128,0.14)',  dot: '#4ADE80', hint: 'Negócio ganho — cliente fechou.' },
  perdido:  { label: 'Perdido',         textColor: '#C99C96', bg: 'rgba(139,111,108,0.2)',  dot: '#8B6F6C', hint: 'Lead perdido ou descartado.' },
};

export const TEMPERATURE_CONFIG = {
  quente: { label: 'Quente', dot: '#FF8A65', bg: 'rgba(255,138,101,0.14)', Icon: Flame },
  morno:  { label: 'Morno',  dot: '#F2C14E', bg: 'rgba(242,193,78,0.14)',  Icon: Sun },
  frio:   { label: 'Frio',   dot: '#8AB4D8', bg: 'rgba(138,180,216,0.14)', Icon: Snowflake },
};

export const SOURCE_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'portal', label: 'Portal imobiliário' },
  { value: 'trafego_pago', label: 'Tráfego pago' },
  { value: 'outro', label: 'Outro' },
];

export const LOST_REASONS = [
  'Preço', 'Financiamento não aprovado', 'Escolheu outro corretor', 'Desistiu da compra', 'Parou de responder', 'Outro',
];

export const ACTIVITY_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { value: 'ligacao', label: 'Ligação', Icon: Phone },
  { value: 'visita', label: 'Visita', Icon: HomeIcon },
  { value: 'proposta', label: 'Proposta', Icon: FileText },
  { value: 'nota', label: 'Nota', Icon: StickyNote },
];

const STAGE_WHATSAPP_TEMPLATE = {
  novo: name => `Olá ${name}! Aqui é da Alpha Imóveis, vi seu interesse e queria entender melhor o que você procura.`,
  contato: name => `Oi ${name}, tudo bem? Ficou alguma dúvida sobre os imóveis que conversamos?`,
  visita: name => `Oi ${name}! Passando pra confirmar nossa visita.`,
  proposta: name => `Oi ${name}, alguma novidade sobre a proposta que enviamos?`,
  fechado: name => `Parabéns, ${name}! Foi um prazer fechar esse negócio com você.`,
  perdido: name => `Oi ${name}, tudo bem? Fico à disposição se precisar de algo no futuro.`,
};

export function leadWhatsappLink(lead) {
  const number = normalizePhone(lead.phone);
  const text = (STAGE_WHATSAPP_TEMPLATE[lead.stage] || STAGE_WHATSAPP_TEMPLATE.novo)(lead.name);
  return number ? `https://wa.me/55${number}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function TempBadge({ temperature }) {
  const cfg = TEMPERATURE_CONFIG[temperature] || TEMPERATURE_CONFIG.morno;
  const Icon = cfg.Icon;
  return (
    <span className="status-pill temp-pill" style={{ color: cfg.dot, background: cfg.bg }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function LeadCard({ lead, staleDays, onOpen }) {
  const last = lead.lastContactAt || lead.createdAt;
  const days = daysSince(last);
  const isActive = lead.stage !== 'fechado' && lead.stage !== 'perdido';
  const isStale = isActive && days !== null && days >= staleDays;
  const overdue = isActive && lead.nextActionDate && lead.nextActionDate < todayStr();

  return (
    <div
      className={`lead-card ${isStale ? 'stale' : ''}`}
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', lead.id)}
      onClick={onOpen}
    >
      <div className="lead-card-top">
        <strong>{lead.name}</strong>
        <TempBadge temperature={lead.temperature} />
      </div>
      <p className="lead-card-phone"><Phone size={11} /> {formatPhoneDisplay(lead.phone)}</p>
      {lead.nextActionText && (
        <p className={`lead-next-action ${overdue ? 'overdue' : ''}`}>
          <Calendar size={11} /> {lead.nextActionText}{lead.nextActionDate ? ` · ${lead.nextActionDate.split('-').reverse().join('/')}` : ''}
        </p>
      )}
      <div className="lead-card-footer">
        <span className={isStale ? 'lead-days stale' : 'lead-days'}>{days === null ? '—' : `${days}d sem contato`}</span>
        {isStale && <span className="stale-flag"><AlertTriangle size={11} /> esfriando</span>}
      </div>
    </div>
  );
}

export function KanbanBoard({ leads, staleDays, onOpenLead, onStageChange }) {
  const [dragOverStage, setDragOverStage] = useState(null);

  function handleDrop(e, stage) {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== stage) onStageChange(lead, stage);
  }

  return (
    <div className="kanban-board">
      {STAGE_ORDER.map(stage => {
        const cfg = STAGE_CONFIG[stage];
        const stageLeads = leads.filter(l => l.stage === stage);
        return (
          <div
            key={stage}
            className={`kanban-column ${dragOverStage === stage ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
            onDragLeave={() => setDragOverStage(prev => (prev === stage ? null : prev))}
            onDrop={e => handleDrop(e, stage)}
          >
            <div className="kanban-column-header" title={cfg.hint} style={{ borderColor: cfg.dot }}>
              <span className="kanban-column-dot" style={{ background: cfg.dot }} />
              <span className="kanban-column-title">{cfg.label}</span>
              <span className="kanban-column-count">{stageLeads.length}</span>
            </div>
            <div className="kanban-column-body">
              {stageLeads.length === 0 && <p className="kanban-empty">Arraste um lead pra cá</p>}
              {stageLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} staleDays={staleDays} onOpen={() => onOpenLead(lead)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NewLeadModal({ leads, defaultAgent, onCreate, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('instagram');
  const [temperature, setTemperature] = useState('morno');
  const [nextActionText, setNextActionText] = useState('Fazer primeiro contato');
  const [nextActionDate, setNextActionDate] = useState(todayStr());
  const [error, setError] = useState('');
  const [dup, setDup] = useState(null);

  function handleSubmit(force) {
    if (!name.trim()) { setError('Digite o nome do lead.'); return; }
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) { setError('Digite o telefone do lead.'); return; }
    if (!force) {
      const existing = leads.find(l => normalizePhone(l.phone) === cleanPhone);
      if (existing) { setDup(existing); return; }
    }
    setError('');
    onCreate({
      id: uid(), name: name.trim(), phone: cleanPhone, source, stage: 'novo', temperature,
      assignedAgent: defaultAgent || 'Equipe', activity: [],
      nextActionText: nextActionText.trim(), nextActionDate, lostReason: '',
      createdAt: Date.now(), updatedAt: Date.now(), lastContactAt: Date.now(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo lead</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error"><AlertTriangle size={14} /> {error}</div>}
          {dup && (
            <div className="form-error warn">
              <AlertTriangle size={14} /> Já existe um lead com esse telefone: <strong>{dup.name}</strong>. Quer criar mesmo assim?
            </div>
          )}
          <label className="field"><span>Nome</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do lead" autoFocus />
          </label>
          <label className="field"><span>Telefone</span>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(84) 99999-9999" />
          </label>
          <label className="field"><span>Origem</span>
            <select value={source} onChange={e => setSource(e.target.value)}>
              {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Temperatura</span>
            <select value={temperature} onChange={e => setTemperature(e.target.value)}>
              <option value="quente">Quente</option>
              <option value="morno">Morno</option>
              <option value="frio">Frio</option>
            </select>
          </label>
          <label className="field"><span>Próxima ação</span>
            <input value={nextActionText} onChange={e => setNextActionText(e.target.value)} placeholder="Ex: Ligar apresentando imóveis" />
          </label>
          <label className="field"><span>Data</span>
            <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => handleSubmit(!!dup)}>{dup ? 'Criar mesmo assim' : 'Criar lead'}</button>
        </div>
      </div>
    </div>
  );
}

export function LeadDetailModal({ lead, selections, onSave, onDelete, onStageChange, onCreateSelectionFor, onClose }) {
  const [activityType, setActivityType] = useState('whatsapp');
  const [activityText, setActivityText] = useState('');
  const linkedSelections = (selections || []).filter(s => s.leadId === lead.id);

  function update(field, value) { onSave({ ...lead, [field]: value, updatedAt: Date.now() }); }

  function addActivity() {
    if (!activityText.trim()) return;
    const entry = { id: uid(), type: activityType, text: activityText.trim(), at: Date.now() };
    onSave({ ...lead, activity: [entry, ...(lead.activity || [])], lastContactAt: Date.now(), updatedAt: Date.now() });
    setActivityText('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lead.name}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="field"><span>Nome</span>
              <input value={lead.name} onChange={e => update('name', e.target.value)} />
            </label>
            <label className="field"><span>Telefone</span>
              <input value={formatPhoneDisplay(lead.phone)} onChange={e => update('phone', normalizePhone(e.target.value))} />
            </label>
            <label className="field"><span>Origem</span>
              <select value={lead.source} onChange={e => update('source', e.target.value)}>
                {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Temperatura</span>
              <select value={lead.temperature} onChange={e => update('temperature', e.target.value)}>
                <option value="quente">Quente</option>
                <option value="morno">Morno</option>
                <option value="frio">Frio</option>
              </select>
            </label>
            <label className="field"><span>Etapa</span>
              <select value={lead.stage} onChange={e => onStageChange(lead, e.target.value)}>
                {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
              </select>
            </label>
            <label className="field"><span>Corretor responsável</span>
              <input value={lead.assignedAgent || ''} onChange={e => update('assignedAgent', e.target.value)} />
            </label>
            <label className="field span-2"><span>Próxima ação</span>
              <input value={lead.nextActionText || ''} onChange={e => update('nextActionText', e.target.value)} placeholder="Ex: Ligar confirmando visita" />
            </label>
            <label className="field"><span>Data da próxima ação</span>
              <input type="date" value={lead.nextActionDate || ''} onChange={e => update('nextActionDate', e.target.value)} />
            </label>
          </div>

          {lead.stage === 'perdido' && (
            <div className="internal-box">
              <span className="section-label internal"><AlertTriangle size={14} /> Motivo da perda</span>
              <select value={lead.lostReason || ''} onChange={e => update('lostReason', e.target.value)}>
                <option value="">Selecione...</option>
                {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <div className="activity-section">
            <span className="section-label">Histórico de contato</span>
            <div className="activity-add">
              <select value={activityType} onChange={e => setActivityType(e.target.value)}>
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={activityText} onChange={e => setActivityText(e.target.value)} placeholder="O que aconteceu?" onKeyDown={e => { if (e.key === 'Enter') addActivity(); }} />
              <button className="icon-btn" onClick={addActivity}><Plus size={15} /></button>
            </div>
            <div className="activity-log">
              {(lead.activity || []).length === 0 && <p className="empty-hint">Nenhum contato registrado ainda.</p>}
              {(lead.activity || []).map(entry => {
                const typeCfg = ACTIVITY_TYPES.find(t => t.value === entry.type) || ACTIVITY_TYPES[4];
                const Icon = typeCfg.Icon;
                return (
                  <div className="activity-entry" key={entry.id}>
                    <span className="activity-icon"><Icon size={13} /></span>
                    <div className="activity-entry-body">
                      <p>{entry.text}</p>
                      <span>{new Date(entry.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="linked-selections">
            <span className="section-label">Seleções enviadas</span>
            {linkedSelections.length === 0 ? (
              <p className="empty-hint">Nenhuma seleção vinculada ainda.</p>
            ) : (
              linkedSelections.map(s => (
                <div className="linked-selection-row" key={s.id}>
                  <span className="selection-code small">{s.id}</span>
                  <span>{s.propertyIds.length} imóveis · {new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              ))
            )}
            <button className="link-btn" onClick={() => onCreateSelectionFor(lead)}><Share2 size={13} /> Criar seleção pra esse lead</button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="icon-btn danger" onClick={() => onDelete(lead)}><Trash2 size={15} /></button>
          <a className="btn-ghost" href={leadWhatsappLink(lead)} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> WhatsApp</a>
          <button className="btn-primary" onClick={onClose}>Concluir</button>
        </div>
      </div>
    </div>
  );
}

export function LostReasonModal({ lead, onConfirm, onClose }) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel tiny" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Marcar como perdido</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="muted-small" style={{ marginBottom: 10 }}>Por que <strong>{lead.name}</strong> foi perdido? Isso ajuda a identificar padrões depois.</p>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-danger" onClick={() => onConfirm(reason)}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function TodayView({ leads, staleDays, onOpenLead }) {
  const today = todayStr();
  const active = leads.filter(l => l.stage !== 'fechado' && l.stage !== 'perdido');
  const dueToday = active.filter(l => l.nextActionDate && l.nextActionDate <= today);
  const stale = active.filter(l => {
    const d = daysSince(l.lastContactAt || l.createdAt);
    return d !== null && d >= staleDays;
  });

  const counts = Object.fromEntries(STAGE_ORDER.map(s => [s, leads.filter(l => l.stage === s).length]));
  const funnelStages = ['novo', 'contato', 'visita', 'proposta', 'fechado'];
  function pct(from, to) {
    const a = counts[from], b = counts[to];
    return a > 0 ? Math.round((b / a) * 100) : 0;
  }

  return (
    <div className="today-view">
      <div className="today-grid">
        <div className="today-card">
          <span className="today-card-title"><Calendar size={14} /> Follow-ups de hoje / atrasados ({dueToday.length})</span>
          {dueToday.length === 0 ? <p className="empty-hint">Nada pendente — bom sinal.</p> : (
            <div className="today-list">
              {dueToday.map(l => (
                <button className="today-row" key={l.id} onClick={() => onOpenLead(l)}>
                  <strong>{l.name}</strong>
                  <span>{l.nextActionText}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="today-card">
          <span className="today-card-title"><AlertTriangle size={14} /> Esfriando ({stale.length})</span>
          {stale.length === 0 ? <p className="empty-hint">Nenhum lead esfriando.</p> : (
            <div className="today-list">
              {stale.map(l => (
                <button className="today-row" key={l.id} onClick={() => onOpenLead(l)}>
                  <strong>{l.name}</strong>
                  <span>{daysSince(l.lastContactAt || l.createdAt)} dias sem contato</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="today-card">
        <span className="today-card-title"><TrendingUp size={14} /> Funil</span>
        <div className="funnel-row">
          {funnelStages.map((stage, i) => (
            <React.Fragment key={stage}>
              <div className="funnel-step">
                <span className="funnel-count" style={{ color: STAGE_CONFIG[stage].dot }}>{counts[stage]}</span>
                <span className="funnel-label">{STAGE_CONFIG[stage].label}</span>
              </div>
              {i < funnelStages.length - 1 && (
                <div className="funnel-arrow">
                  <ArrowRight size={14} />
                  <span>{pct(stage, funnelStages[i + 1])}%</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="muted-small" style={{ marginTop: 10 }}>{counts.perdido} perdido{counts.perdido === 1 ? '' : 's'} no total</p>
      </div>
    </div>
  );
}
