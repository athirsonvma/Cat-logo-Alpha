import React, { useState, useEffect } from 'react';
import {
  Home, Search, Plus, X, Copy, Share2, MessageCircle, ClipboardList,
  Loader2, AlertCircle, Eye, EyeOff, UserPlus, LayoutGrid, CalendarClock, Map as MapIcon, List,
  Sun, Moon
} from 'lucide-react';
import {
  getSettings, saveSettings, subscribeProperties, subscribeSelections, subscribeLeads,
  saveProperty, deleteProperty, saveSelection, deleteSelection, saveLead, deleteLead
} from './data.js';
import { uid, generateCode, todayStr, normalizePhone } from './helpers.js';
import {
  LogoMark, PropertyCard, PropertyForm, SelectionForm, LandingView, GateScreen, ClientView, PhotoLightbox,
} from './PropertyViews.jsx';
import { GoogleMapView } from './MapView.jsx';
import {
  KanbanBoard, NewLeadModal, LeadDetailModal, LostReasonModal, TodayView,
} from './CrmViews.jsx';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState('landing');
  const [settings, setSettings] = useState({ teamPasscode: 'equipe2026', agencyName: 'Alpha Imóveis', whatsappNumber: '' });
  const [properties, setProperties] = useState([]);
  const [selections, setSelections] = useState([]);
  const [leads, setLeads] = useState([]);
  const [corretorName, setCorretorName] = useState(() => {
    try { return localStorage.getItem('corretorName') || ''; } catch (e) { return ''; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; }
  });

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  }

  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const [teamTab, setTeamTab] = useState('crm');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showSold, setShowSold] = useState(false);
  const [propertyView, setPropertyView] = useState('lista');
  const [crmView, setCrmView] = useState('board');

  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewingPhotosProperty, setViewingPhotosProperty] = useState(null);
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [selectionPreset, setSelectionPreset] = useState(null);
  const [newSelectionResult, setNewSelectionResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [lostReasonPending, setLostReasonPending] = useState(null);

  const [clientSelection, setClientSelection] = useState(null);
  const [cameFromTeam, setCameFromTeam] = useState(false);
  const [photoIdx, setPhotoIdx] = useState({});

  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(false);
    let settingsReady = false, propsReady = false, selsReady = false, leadsReady = false;
    function checkReady() { if (mounted && settingsReady && propsReady && selsReady && leadsReady) setLoading(false); }

    getSettings()
      .then(s => { if (mounted) { setSettings(s); settingsReady = true; checkReady(); } })
      .catch(() => { if (mounted) setLoadError(true); });

    const unsubProps = subscribeProperties(
      props => { if (mounted) { setProperties(props); propsReady = true; checkReady(); } },
      () => { if (mounted) setLoadError(true); }
    );
    const unsubSels = subscribeSelections(
      sels => { if (mounted) { setSelections(sels); selsReady = true; checkReady(); } },
      () => { if (mounted) setLoadError(true); }
    );
    const unsubLeads = subscribeLeads(
      lds => { if (mounted) { setLeads(lds); leadsReady = true; checkReady(); } },
      () => { if (mounted) setLoadError(true); }
    );

    return () => { mounted = false; unsubProps(); unsubSels(); unsubLeads(); };
  }, []);

  function showToast(text) { setToast(text); setTimeout(() => setToast(null), 2600); }
  function reloadPage() { window.location.reload(); }

  function handleTeamGate() {
    if (passInput === settings.teamPasscode) { setView('team'); setPassInput(''); setPassError(''); }
    else setPassError('Código incorreto. Confira com quem cuida do catálogo.');
  }

  function handleClientGate() {
    const found = selections.find(s => s.id.toUpperCase() === codeInput.trim().toUpperCase());
    if (found) { setClientSelection(found); setCameFromTeam(false); setView('client'); setCodeInput(''); setCodeError(''); }
    else setCodeError('Código não encontrado. Confira com seu corretor.');
  }

  function openClientPreview(sel) {
    setClientSelection(sel);
    setCameFromTeam(true);
    setView('client');
  }

  // ---- Imóveis ----
  async function handleSaveProperty(property) {
    const exists = properties.some(p => p.id === property.id);
    const withMeta = { ...property, lastEditedBy: corretorName || 'Equipe', lastEditedAt: Date.now() };
    try {
      await saveProperty(withMeta);
      showToast(exists ? 'Imóvel atualizado.' : 'Imóvel adicionado ao catálogo.');
    } catch (e) { showToast('Não foi possível salvar o imóvel. Verifique sua conexão.'); }
    setShowPropertyForm(false);
    setEditingProperty(null);
  }

  async function handleDuplicateProperty(property) {
    const dup = {
      ...property, id: uid(), title: property.title + ' (cópia)', status: 'disponivel',
      createdAt: Date.now(), lastEditedBy: corretorName || 'Equipe', lastEditedAt: Date.now(),
    };
    try { await saveProperty(dup); showToast('Imóvel duplicado.'); }
    catch (e) { showToast('Não foi possível duplicar o imóvel.'); }
  }

  async function handleQuickStatusChange(property, newStatus) {
    try {
      await saveProperty({ ...property, status: newStatus, lastEditedBy: corretorName || 'Equipe', lastEditedAt: Date.now() });
      showToast(`Status atualizado para ${STATUS_LABEL(newStatus)}.`);
    } catch (e) { showToast('Não foi possível atualizar o status.'); }
  }
  function STATUS_LABEL(s) { return { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido' }[s] || s; }

  // ---- Seleções (agora com ponte pro CRM) ----
  async function handleCreateSelection({ clientName, note, propertyIds, leadLink }) {
    const code = generateCode(selections.map(s => s.id));
    let leadId = null;
    try {
      if (leadLink && leadLink.mode === 'existing' && leadLink.leadId) {
        leadId = leadLink.leadId;
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          const entry = { id: uid(), type: 'nota', text: `Seleção criada: ${propertyIds.length} imóveis (código ${code})`, at: Date.now() };
          await saveLead({ ...lead, activity: [entry, ...(lead.activity || [])], lastContactAt: Date.now(), updatedAt: Date.now() });
        }
      } else if (leadLink && leadLink.mode === 'new') {
        const newLead = {
          id: uid(), name: leadLink.name, phone: normalizePhone(leadLink.phone), source: 'outro', stage: 'contato',
          temperature: 'morno', assignedAgent: corretorName || 'Equipe',
          activity: [{ id: uid(), type: 'nota', text: `Lead criado a partir de uma seleção (código ${code})`, at: Date.now() }],
          nextActionText: 'Acompanhar retorno da seleção enviada', nextActionDate: todayStr(),
          lostReason: '', createdAt: Date.now(), updatedAt: Date.now(), lastContactAt: Date.now(),
        };
        await saveLead(newLead);
        leadId = newLead.id;
      }
      const sel = { id: code, clientName, note, propertyIds, leadId, createdAt: Date.now() };
      await saveSelection(sel);
      setShowSelectionForm(false);
      setSelectionPreset(null);
      setNewSelectionResult(sel);
    } catch (e) { showToast('Não foi possível criar a seleção.'); }
  }

  function openSelectionForLead(lead) {
    setEditingLead(null);
    setSelectionPreset({ clientName: lead.name, leadId: lead.id });
    setShowSelectionForm(true);
  }

  // ---- CRM ----
  async function handleCreateLead(lead) {
    try { await saveLead(lead); setShowNewLeadModal(false); showToast('Lead criado.'); }
    catch (e) { showToast('Não foi possível criar o lead.'); }
  }

  async function handleSaveLead(updatedLead) {
    setEditingLead(updatedLead);
    try { await saveLead(updatedLead); }
    catch (e) { showToast('Não foi possível salvar o lead.'); }
  }

  function handleStageChange(lead, newStage) {
    if (newStage === 'perdido') { setLostReasonPending({ lead }); return; }
    const updated = { ...lead, stage: newStage, updatedAt: Date.now() };
    if (editingLead && editingLead.id === lead.id) setEditingLead(updated);
    saveLead(updated).catch(() => showToast('Não foi possível mover o lead.'));
    if (newStage === 'fechado') showToast(`${lead.name} fechou negócio!`);
  }

  function confirmLostReason(reason) {
    const { lead } = lostReasonPending;
    const updated = { ...lead, stage: 'perdido', lostReason: reason, updatedAt: Date.now() };
    if (editingLead && editingLead.id === lead.id) setEditingLead(updated);
    saveLead(updated).catch(() => showToast('Não foi possível mover o lead.'));
    setLostReasonPending(null);
  }

  function persistSettings(next) {
    setSettings(next);
    saveSettings(next).catch(() => showToast('Não foi possível salvar as configurações.'));
  }

  function updateCorretorName(name) {
    setCorretorName(name);
    try { localStorage.setItem('corretorName', name); } catch (e) {}
  }

  function copyCode(code) {
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    showToast('Código copiado!');
  }

  function whatsappSelectionLink(sel) {
    const text = `Olá! Selecionei alguns imóveis para você em nosso catálogo. Acesse e use o código: ${sel.id}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  function whatsappInterestLink(property) {
    const number = (settings.whatsappNumber || '').replace(/\D/g, '');
    const text = `Olá! Tenho interesse no imóvel "${property.title}".`;
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function nextPhoto(id, len) { setPhotoIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % len })); }
  function prevPhoto(id, len) { setPhotoIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + len) % len })); }

  function staleCount(sel) {
    return sel.propertyIds.filter(id => {
      const p = properties.find(pr => pr.id === id);
      return !p || p.status === 'vendido';
    }).length;
  }

  const filteredProperties = properties.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.bairro || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const hideSold = !showSold && p.status === 'vendido' && statusFilter !== 'vendido';
    return matchesSearch && matchesStatus && !hideSold;
  });

  if (loading) {
    return (
      <div className={`re-app ${theme === 'light' ? 'theme-light' : ''}`}>
        <div className="loading-screen"><Loader2 className="spin" size={26} /> <span>Carregando catálogo...</span></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`re-app ${theme === 'light' ? 'theme-light' : ''}`}>
        <div className="loading-screen" style={{ flexDirection: 'column', gap: 16 }}>
          <AlertCircle size={26} />
          <span>Não foi possível conectar ao banco de dados.</span>
          <button className="btn-primary" onClick={reloadPage}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`re-app ${theme === 'light' ? 'theme-light' : ''}`}>
      {(view === 'landing' || view === 'teamGate' || view === 'clientGate') && (
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema" title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}

      {view === 'landing' && (
        <LandingView onTeam={() => setView('teamGate')} onClient={() => setView('clientGate')} />
      )}

      {view === 'teamGate' && (
        <GateScreen
          title="Acesso da equipe"
          description="Digite o código de acesso do time para gerenciar o catálogo."
          value={passInput} onChange={setPassInput} onSubmit={handleTeamGate} error={passError}
          onBack={() => { setView('landing'); setPassError(''); setPassInput(''); }}
          placeholder="Código de acesso"
        />
      )}

      {view === 'clientGate' && (
        <GateScreen
          title="Ver seleção de imóveis"
          description="Digite o código de 6 letras que seu corretor te enviou."
          value={codeInput} onChange={v => setCodeInput(v.toUpperCase())} onSubmit={handleClientGate} error={codeError}
          onBack={() => { setView('landing'); setCodeError(''); setCodeInput(''); }}
          placeholder="Ex: 7F3K9M" uppercase
        />
      )}

      {view === 'team' && (
        <div className="team-shell">
          <header className="team-header">
            <div className="brand"><LogoMark size={20} /> <span>{settings.agencyName}</span></div>
            <nav className="team-nav">
              <button className={teamTab === 'crm' ? 'active' : ''} onClick={() => setTeamTab('crm')}>CRM</button>
              <button className={teamTab === 'imoveis' ? 'active' : ''} onClick={() => setTeamTab('imoveis')}>Imóveis</button>
              <button className={teamTab === 'selecoes' ? 'active' : ''} onClick={() => setTeamTab('selecoes')}>Seleções</button>
              <button className={teamTab === 'config' ? 'active' : ''} onClick={() => setTeamTab('config')}>Configurações</button>
            </nav>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Alternar tema" title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn-ghost small" onClick={() => setView('landing')}>Sair</button>
          </header>

          {teamTab === 'imoveis' && (
            <div className="team-content">
              <div className="toolbar">
                <div className="search-box"><Search size={15} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título ou bairro..." />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="todos">Todos os status</option>
                  <option value="disponivel">Disponível</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </select>
                <button className={`btn-ghost small toggle-sold ${showSold ? 'active' : ''}`} onClick={() => setShowSold(v => !v)}>
                  {showSold ? <Eye size={14} /> : <EyeOff size={14} />} Vendidos
                </button>
                <div className="crm-subnav">
                  <button className={propertyView === 'lista' ? 'active' : ''} onClick={() => setPropertyView('lista')}><List size={14} /> Lista</button>
                  <button className={propertyView === 'mapa' ? 'active' : ''} onClick={() => setPropertyView('mapa')}><MapIcon size={14} /> Mapa</button>
                </div>
                <button className="btn-primary" onClick={() => { setEditingProperty(null); setShowPropertyForm(true); }}>
                  <Plus size={16} /> Novo imóvel
                </button>
              </div>

              {propertyView === 'mapa' ? (
                <GoogleMapView
                  height={480}
                  markers={filteredProperties.map(p => ({ id: p.id, lat: p.latitude, lng: p.longitude, label: p.title }))}
                  onMarkerClick={id => { const prop = properties.find(x => x.id === id); if (prop) { setEditingProperty(prop); setShowPropertyForm(true); } }}
                />
              ) : filteredProperties.length === 0 ? (
                <div className="empty-state">
                  <Home size={32} strokeWidth={1.3} />
                  <h3>{properties.length === 0 ? 'Nenhum imóvel cadastrado ainda' : 'Nada encontrado'}</h3>
                  <p>{properties.length === 0 ? 'Adicione o primeiro imóvel para começar seu catálogo.' : 'Tente ajustar a busca ou os filtros.'}</p>
                  {properties.length === 0 && (
                    <button className="btn-primary" onClick={() => { setEditingProperty(null); setShowPropertyForm(true); }}>
                      <Plus size={16} /> Adicionar imóvel
                    </button>
                  )}
                </div>
              ) : (
                <div className="property-grid">
                  {filteredProperties.map(p => (
                    <PropertyCard key={p.id} property={p}
                      onEdit={prop => { setEditingProperty(prop); setShowPropertyForm(true); }}
                      onDelete={prop => setConfirmDelete({ kind: 'property', item: prop })}
                      onDuplicate={handleDuplicateProperty}
                      onStatusChange={handleQuickStatusChange}
                      onViewPhotos={setViewingPhotosProperty} />
                  ))}
                </div>
              )}
            </div>
          )}

          {teamTab === 'crm' && (
            <div className="team-content">
              <div className="toolbar">
                <div className="crm-subnav">
                  <button className={crmView === 'board' ? 'active' : ''} onClick={() => setCrmView('board')}><LayoutGrid size={14} /> Quadro</button>
                  <button className={crmView === 'hoje' ? 'active' : ''} onClick={() => setCrmView('hoje')}><CalendarClock size={14} /> Hoje</button>
                </div>
                <div style={{ flex: 1 }} />
                <button className="btn-primary" onClick={() => setShowNewLeadModal(true)}>
                  <Plus size={16} /> Novo lead
                </button>
              </div>

              {crmView === 'board' ? (
                leads.length === 0 ? (
                  <div className="empty-state">
                    <UserPlus size={32} strokeWidth={1.3} />
                    <h3>Nenhum lead cadastrado ainda</h3>
                    <p>Adicione o primeiro lead pra começar a organizar seus contatos.</p>
                    <button className="btn-primary" onClick={() => setShowNewLeadModal(true)}>
                      <Plus size={16} /> Adicionar lead
                    </button>
                  </div>
                ) : (
                  <KanbanBoard leads={leads} onOpenLead={setEditingLead} onStageChange={handleStageChange} />
                )
              ) : (
                <TodayView leads={leads} onOpenLead={setEditingLead} />
              )}
            </div>
          )}

          {teamTab === 'selecoes' && (
            <div className="team-content">
              <div className="toolbar">
                <div style={{ flex: 1 }} />
                <button className="btn-primary" onClick={() => { setSelectionPreset(null); setShowSelectionForm(true); }}>
                  <Plus size={16} /> Nova seleção
                </button>
              </div>
              {selections.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={32} strokeWidth={1.3} />
                  <h3>Nenhuma seleção criada</h3>
                  <p>Crie uma seleção personalizada de imóveis para compartilhar com um cliente.</p>
                </div>
              ) : (
                <div className="selection-list">
                  {selections.map(sel => {
                    const stale = staleCount(sel);
                    return (
                      <div className="selection-card" key={sel.id}>
                        <div className="selection-info">
                          <strong>{sel.clientName}</strong>
                          <span>{sel.propertyIds.length} imóve{sel.propertyIds.length === 1 ? 'l' : 'is'} · {new Date(sel.createdAt).toLocaleDateString('pt-BR')}</span>
                          {stale > 0 && (
                            <span className="stale-warning"><AlertCircle size={12} /> {stale} imóvel(is) já vendido(s) ou removido(s)</span>
                          )}
                        </div>
                        <div className="selection-code" onClick={() => copyCode(sel.id)} title="Copiar código">
                          {sel.id} <Copy size={13} />
                        </div>
                        <div className="selection-actions">
                          <a className="icon-btn" href={whatsappSelectionLink(sel)} target="_blank" rel="noopener noreferrer" aria-label="Enviar por WhatsApp"><MessageCircle size={15} /></a>
                          <button className="icon-btn" onClick={() => openClientPreview(sel)} aria-label="Pré-visualizar"><Share2 size={15} /></button>
                          <button className="icon-btn danger" onClick={() => setConfirmDelete({ kind: 'selection', item: sel })} aria-label="Excluir"><X size={15} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {teamTab === 'config' && (
            <div className="team-content">
              <div className="config-panel">
                <label className="field"><span>Seu nome (aparece como "editado por" nos imóveis e responsável nos leads)</span>
                  <input value={corretorName} onChange={e => updateCorretorName(e.target.value)} placeholder="Ex: Athirson" />
                </label>
                <label className="field"><span>Nome da imobiliária</span>
                  <input value={settings.agencyName} onChange={e => persistSettings({ ...settings, agencyName: e.target.value })} />
                </label>
                <label className="field"><span>WhatsApp para contato (com DDD, só números)</span>
                  <input value={settings.whatsappNumber} onChange={e => persistSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="5584999999999" />
                </label>
                <label className="field"><span>Código de acesso da equipe</span>
                  <input value={settings.teamPasscode} onChange={e => persistSettings({ ...settings, teamPasscode: e.target.value })} />
                </label>
                <p className="config-hint">Compartilhe o código de acesso com os corretores. O nome é salvo só neste navegador/dispositivo.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'client' && clientSelection && (
        <ClientView
          agencyName={settings.agencyName}
          selection={clientSelection}
          properties={properties.filter(p => clientSelection.propertyIds.includes(p.id))}
          photoIdx={photoIdx}
          onNext={nextPhoto}
          onPrev={prevPhoto}
          onExit={() => setView(cameFromTeam ? 'team' : 'landing')}
          whatsappLink={whatsappInterestLink}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {viewingPhotosProperty && (
        <PhotoLightbox property={viewingPhotosProperty} onClose={() => setViewingPhotosProperty(null)} />
      )}

      {showPropertyForm && (
        <PropertyForm
          initial={editingProperty}
          onSave={handleSaveProperty}
          onClose={() => { setShowPropertyForm(false); setEditingProperty(null); }}
        />
      )}

      {showSelectionForm && (
        <SelectionForm
          properties={properties}
          leads={leads}
          presetClientName={selectionPreset?.clientName}
          presetLeadId={selectionPreset?.leadId}
          onCreate={handleCreateSelection}
          onClose={() => { setShowSelectionForm(false); setSelectionPreset(null); }}
        />
      )}

      {showNewLeadModal && (
        <NewLeadModal
          leads={leads}
          defaultAgent={corretorName}
          onCreate={handleCreateLead}
          onClose={() => setShowNewLeadModal(false)}
        />
      )}

      {editingLead && (
        <LeadDetailModal
          lead={editingLead}
          properties={properties}
          selections={selections}
          onSave={handleSaveLead}
          onDelete={lead => { setEditingLead(null); setConfirmDelete({ kind: 'lead', item: lead }); }}
          onStageChange={handleStageChange}
          onCreateSelectionFor={openSelectionForLead}
          onClose={() => setEditingLead(null)}
        />
      )}

      {lostReasonPending && (
        <LostReasonModal
          lead={lostReasonPending.lead}
          onConfirm={confirmLostReason}
          onClose={() => setLostReasonPending(null)}
        />
      )}

      {newSelectionResult && (
        <div className="modal-overlay" onClick={() => setNewSelectionResult(null)}>
          <div className="modal-panel small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Seleção criada!</h2>
              <button className="icon-btn" onClick={() => setNewSelectionResult(null)}><X size={18} /></button>
            </div>
            <div className="modal-body center">
              <p>Compartilhe este código com <strong>{newSelectionResult.clientName}</strong>:</p>
              <div className="big-code" onClick={() => copyCode(newSelectionResult.id)}>{newSelectionResult.id} <Copy size={18} /></div>
              <a className="btn-primary whatsapp-btn" href={whatsappSelectionLink(newSelectionResult)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> Enviar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-panel tiny" onClick={e => e.stopPropagation()}>
            <div className="modal-body center">
              <AlertCircle size={24} />
              <p>
                {confirmDelete.kind === 'property' && `Excluir o imóvel "${confirmDelete.item.title}"?`}
                {confirmDelete.kind === 'selection' && `Excluir a seleção de "${confirmDelete.item.clientName}"?`}
                {confirmDelete.kind === 'lead' && `Excluir o lead "${confirmDelete.item.name}"?`}
              </p>
              <p className="muted-small">Essa ação não pode ser desfeita.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger" onClick={async () => {
                try {
                  if (confirmDelete.kind === 'property') {
                    await deleteProperty(confirmDelete.item.id);
                    showToast('Imóvel removido.');
                  } else if (confirmDelete.kind === 'selection') {
                    await deleteSelection(confirmDelete.item.id);
                    showToast('Seleção removida.');
                  } else if (confirmDelete.kind === 'lead') {
                    await deleteLead(confirmDelete.item.id);
                    showToast('Lead removido.');
                  }
                } catch (e) { showToast('Não foi possível excluir.'); }
                setConfirmDelete(null);
              }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
