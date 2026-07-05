import React, { useState, useEffect } from 'react';
import {
  Home, Bed, Bath, Car, Ruler, MapPin, Search, Plus, X, Check, Copy,
  Share2, Lock, ArrowLeft, Pencil, Trash2, Image as ImageIcon,
  MessageCircle, ClipboardList, Users, ChevronRight,
  ChevronLeft, Loader2, AlertCircle, Eye, EyeOff, CopyPlus
} from 'lucide-react';
import {
  getSettings, saveSettings, subscribeProperties, subscribeSelections,
  saveProperty, deleteProperty, saveSelection, deleteSelection
} from './data.js';
import { uploadToCloudinary, cloudinaryResize } from './cloudinary.js';

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', textColor: '#6EE7B7', bg: 'rgba(52,211,153,0.14)', dot: '#34D399' },
  reservado:  { label: 'Reservado',  textColor: '#FCD34D', bg: 'rgba(251,191,36,0.14)', dot: '#FBBF24' },
  vendido:    { label: 'Vendido',    textColor: '#9CA3AF', bg: 'rgba(156,163,175,0.14)', dot: '#9CA3AF' },
};

function formatPrice(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function generateCode(existingCodes) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (existingCodes.includes(code));
  return code;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function daysOnMarket(createdAt) {
  if (!createdAt) return 0;
  return Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
}

function LogoMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 21H2L12 2Z" fill="currentColor" />
    </svg>
  );
}

function WatermarkTriangle() {
  return (
    <svg className="watermark-triangle" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L22 21H2L12 2Z" fill="currentColor" />
    </svg>
  );
}

function StatusStamp({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disponivel;
  return (
    <span className="status-pill" style={{ color: cfg.textColor, background: cfg.bg }}>
      <span className="status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function StatusQuickSelect({ status, onChange }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disponivel;
  return (
    <select
      className="status-pill status-select"
      value={status}
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.value)}
      style={{ color: cfg.textColor, background: cfg.bg }}
    >
      <option value="disponivel">Disponível</option>
      <option value="reservado">Reservado</option>
      <option value="vendido">Vendido</option>
    </select>
  );
}

function PhotoThumb({ src, alt, className }) {
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); }, [src]);
  return (
    <div className={`photo-thumb ${className || ''}`}>
      <div className="photo-fallback"><Home size={26} strokeWidth={1.5} /></div>
      {src && !error && <img src={src} alt={alt || ''} onError={() => setError(true)} />}
    </div>
  );
}

function PropertyCard({ property, onEdit, onDelete, onDuplicate, onStatusChange }) {
  const thumb = property.photos && property.photos[0] ? cloudinaryResize(property.photos[0], 400) : '';
  const days = daysOnMarket(property.createdAt);
  return (
    <div className="prop-card">
      <PhotoThumb src={thumb} alt={property.title} className="prop-card-photo" />
      <div className="prop-card-body">
        <div className="prop-card-top">
          <StatusQuickSelect status={property.status} onChange={v => onStatusChange(property, v)} />
          <div className="prop-card-actions">
            <button className="icon-btn" onClick={() => onDuplicate(property)} aria-label="Duplicar"><CopyPlus size={15} /></button>
            <button className="icon-btn" onClick={() => onEdit(property)} aria-label="Editar"><Pencil size={15} /></button>
            <button className="icon-btn danger" onClick={() => onDelete(property)} aria-label="Excluir"><Trash2 size={15} /></button>
          </div>
        </div>
        <h3 className="prop-title">{property.title || 'Sem título'}</h3>
        <p className="prop-location"><MapPin size={13} /> {property.bairro}{property.bairro && property.cidade ? ', ' : ''}{property.cidade}</p>
        <p className="prop-price">{formatPrice(property.price)}</p>
        <div className="prop-specs">
          <span><Bed size={14} /> {property.bedrooms || 0}</span>
          <span><Bath size={14} /> {property.bathrooms || 0}</span>
          <span><Ruler size={14} /> {property.area || 0}m²</span>
          <span><Car size={14} /> {property.vagas || 0}</span>
        </div>
        <div className="prop-card-footer">
          <span className={days > 45 ? 'days-badge warn' : 'days-badge'}>{days} {days === 1 ? 'dia' : 'dias'} no mercado</span>
          {property.lastEditedBy && <span className="edited-by">editado por {property.lastEditedBy}</span>}
        </div>
      </div>
    </div>
  );
}

function PropertyForm({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    bairro: initial?.bairro || '',
    cidade: initial?.cidade || '',
    price: initial?.price ?? '',
    bedrooms: initial?.bedrooms ?? '',
    bathrooms: initial?.bathrooms ?? '',
    area: initial?.area ?? '',
    vagas: initial?.vagas ?? '',
    status: initial?.status || 'disponivel',
    description: initial?.description || '',
    featuresText: (initial?.features || []).join(', '),
    photos: initial?.photos ? [...initial.photos] : [],
    internalNotes: initial?.internalNotes || '',
    ownerContact: initial?.ownerContact || '',
    commission: initial?.commission || '',
    corretorResponsavel: initial?.corretorResponsavel || '',
  }));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); }
  function removePhoto(idx) { setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) })); }

  async function handleFilesSelected(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError('');
    const newPhotos = [];
    let failCount = 0;
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Enviando ${i + 1} de ${files.length}...`);
      try {
        const url = await uploadToCloudinary(files[i]);
        newPhotos.push(url);
      } catch (e) { failCount++; }
    }
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    setUploading(false);
    setUploadProgress('');
    if (failCount > 0) setUploadError(`${failCount} foto(s) não puderam ser enviadas. Tente novamente.`);
  }

  function handleSubmit() {
    if (!form.title.trim()) { setError('Dê um título ao imóvel.'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('Informe um preço válido.'); return; }
    setError('');
    setSaving(true);
    const property = {
      id: initial?.id || uid(),
      title: form.title.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      price: Number(form.price),
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      area: Number(form.area) || 0,
      vagas: Number(form.vagas) || 0,
      status: form.status,
      description: form.description.trim(),
      features: form.featuresText.split(',').map(s => s.trim()).filter(Boolean),
      photos: form.photos,
      internalNotes: form.internalNotes.trim(),
      ownerContact: form.ownerContact.trim(),
      commission: form.commission.trim(),
      corretorResponsavel: form.corretorResponsavel.trim(),
      createdAt: initial?.createdAt || Date.now(),
    };
    onSave(property);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Editar imóvel' : 'Novo imóvel'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error"><AlertCircle size={14} /> {error}</div>}
          <div className="form-grid">
            <label className="field span-2"><span>Título</span>
              <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ex: Casa 3 quartos com quintal" />
            </label>
            <label className="field"><span>Bairro</span>
              <input value={form.bairro} onChange={e => update('bairro', e.target.value)} placeholder="Ex: Ponta Negra" />
            </label>
            <label className="field"><span>Cidade</span>
              <input value={form.cidade} onChange={e => update('cidade', e.target.value)} placeholder="Ex: Natal" />
            </label>
            <label className="field"><span>Preço (R$)</span>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="450000" />
            </label>
            <label className="field"><span>Status</span>
              <select value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="disponivel">Disponível</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </select>
            </label>
            <label className="field"><span>Quartos</span>
              <input type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} />
            </label>
            <label className="field"><span>Banheiros</span>
              <input type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} />
            </label>
            <label className="field"><span>Área (m²)</span>
              <input type="number" value={form.area} onChange={e => update('area', e.target.value)} />
            </label>
            <label className="field"><span>Vagas garagem</span>
              <input type="number" value={form.vagas} onChange={e => update('vagas', e.target.value)} />
            </label>
            <label className="field span-2"><span>Descrição (visível para o cliente)</span>
              <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Conte sobre o imóvel..." />
            </label>
            <label className="field span-2"><span>Características (separadas por vírgula)</span>
              <input value={form.featuresText} onChange={e => update('featuresText', e.target.value)} placeholder="piscina, quintal, mobiliado" />
            </label>
          </div>

          <div className="photos-section">
            <span className="section-label"><ImageIcon size={14} /> Fotos</span>
            <div className="photo-grid">
              {form.photos.map((src, idx) => (
                <div className="photo-tile" key={idx}>
                  <img src={cloudinaryResize(src, 200)} alt="" />
                  <button type="button" className="photo-tile-remove" onClick={() => removePhoto(idx)}><X size={13} /></button>
                </div>
              ))}
              <label className="photo-tile add-tile">
                {uploading ? <Loader2 size={18} className="spin" /> : <Plus size={20} />}
                <input type="file" accept="image/*" multiple hidden onChange={e => { handleFilesSelected(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
            {uploading && <p className="upload-progress">{uploadProgress}</p>}
            {uploadError && <div className="form-error" style={{ marginTop: 8 }}><AlertCircle size={14} /> {uploadError}</div>}
          </div>

          <div className="internal-box">
            <span className="section-label internal"><Lock size={14} /> Uso interno — não aparece para o cliente</span>
            <div className="form-grid">
              <label className="field"><span>Corretor responsável</span>
                <input value={form.corretorResponsavel} onChange={e => update('corretorResponsavel', e.target.value)} />
              </label>
              <label className="field"><span>Comissão</span>
                <input value={form.commission} onChange={e => update('commission', e.target.value)} placeholder="Ex: 5%" />
              </label>
              <label className="field span-2"><span>Contato do proprietário</span>
                <input value={form.ownerContact} onChange={e => update('ownerContact', e.target.value)} placeholder="Nome / telefone" />
              </label>
              <label className="field span-2"><span>Observações internas</span>
                <textarea rows={2} value={form.internalNotes} onChange={e => update('internalNotes', e.target.value)} />
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar imóvel'}</button>
        </div>
      </div>
    </div>
  );
}

function SelectionForm({ properties, onCreate, onClose }) {
  const [clientName, setClientName] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = properties.filter(p =>
    p.status !== 'vendido' &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || (p.bairro || '').toLowerCase().includes(search.toLowerCase()))
  );

  function toggle(id) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function handleSubmit() {
    if (!clientName.trim()) { setError('Dê um nome para identificar o cliente.'); return; }
    if (selected.length === 0) { setError('Escolha pelo menos um imóvel.'); return; }
    onCreate({ clientName: clientName.trim(), note: note.trim(), propertyIds: selected });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova seleção para cliente</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error"><AlertCircle size={14} /> {error}</div>}
          <div className="form-grid">
            <label className="field span-2"><span>Cliente</span>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Família Rodrigues" />
            </label>
            <label className="field span-2"><span>Recado para o cliente (opcional)</span>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Selecionei estas opções pensando no que você me contou!" />
            </label>
          </div>
          <div className="select-list-header">
            <span className="section-label">Escolha os imóveis ({selected.length} selecionado{selected.length !== 1 ? 's' : ''})</span>
            <div className="mini-search"><Search size={13} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
            </div>
          </div>
          <div className="select-list">
            {filtered.length === 0 && <p className="empty-hint">Nenhum imóvel disponível encontrado.</p>}
            {filtered.map(p => (
              <label key={p.id} className={`select-row ${selected.includes(p.id) ? 'checked' : ''}`}>
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <PhotoThumb src={p.photos && p.photos[0] ? cloudinaryResize(p.photos[0], 200) : ''} alt="" className="select-row-thumb" />
                <div className="select-row-info">
                  <strong>{p.title}</strong>
                  <span>{p.bairro} · {formatPrice(p.price)}</span>
                </div>
                {selected.includes(p.id) && <Check size={16} className="check-icon" />}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Gerar seleção</button>
        </div>
      </div>
    </div>
  );
}

function LandingView({ onTeam, onClient }) {
  return (
    <div className="landing">
      <WatermarkTriangle />
      <div className="landing-glow" />
      <div className="landing-hero">
        <img className="landing-logo" src="/logo.png" alt="Alpha Imóveis" />
      </div>
      <div className="landing-cards">
        <button className="landing-card" onClick={onTeam}>
          <Users size={24} />
          <h3>Corretor associado</h3>
          <p>Gerenciar imóveis e seleções</p>
          <span className="landing-card-cta">Entrar <ChevronRight size={14} /></span>
        </button>
        <button className="landing-card" onClick={onClient}>
          <ClipboardList size={24} />
          <h3>Cliente</h3>
          <p>Ver imóveis selecionados pra você</p>
          <span className="landing-card-cta">Ver imóveis <ChevronRight size={14} /></span>
        </button>
      </div>
    </div>
  );
}

function GateScreen({ title, description, value, onChange, onSubmit, error, onBack, placeholder, uppercase }) {
  function handleKey(e) { if (e.key === 'Enter') onSubmit(); }
  return (
    <div className="gate-screen">
      <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Voltar</button>
      <div className="gate-box">
        <Lock size={22} />
        <h2>{title}</h2>
        <p>{description}</p>
        <input
          className={uppercase ? 'mono-input' : ''}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          autoFocus
        />
        {error && <div className="form-error center"><AlertCircle size={14} /> {error}</div>}
        <button className="btn-primary full" onClick={onSubmit}>Entrar</button>
      </div>
    </div>
  );
}

function ClientView({ agencyName, selection, properties, photoIdx, onNext, onPrev, onExit, whatsappLink }) {
  return (
    <div className="client-view">
      <header className="client-header">
        <button className="back-link light" onClick={onExit}><ArrowLeft size={15} /> Sair</button>
        <div className="brand"><LogoMark size={18} /> <span>{agencyName}</span></div>
      </header>
      <div className="client-hero">
        <h1>Seleção para {selection.clientName}</h1>
        {selection.note && <p className="client-note">"{selection.note}"</p>}
      </div>
      <div className="client-list">
        {properties.length === 0 && <p className="empty-hint center">Os imóveis desta seleção não estão mais disponíveis.</p>}
        {properties.map(p => {
          const idx = photoIdx[p.id] || 0;
          const photos = p.photos || [];
          return (
            <div className="client-card" key={p.id}>
              <div className="client-carousel">
                <PhotoThumb src={photos[idx] ? cloudinaryResize(photos[idx], 1000) : ''} alt={p.title} className="client-photo" />
                {photos.length > 1 && (
                  <>
                    <button className="carousel-btn left" onClick={() => onPrev(p.id, photos.length)}><ChevronLeft size={18} /></button>
                    <button className="carousel-btn right" onClick={() => onNext(p.id, photos.length)}><ChevronRight size={18} /></button>
                    <div className="carousel-dots">
                      {photos.map((_, i) => <span key={i} className={i === idx ? 'dot active' : 'dot'} />)}
                    </div>
                  </>
                )}
                <StatusStamp status={p.status} />
              </div>
              <div className="client-card-body">
                <h2>{p.title}</h2>
                <p className="client-location"><MapPin size={14} /> {p.bairro}{p.bairro && p.cidade ? ', ' : ''}{p.cidade}</p>
                <p className="client-price">{formatPrice(p.price)}</p>
                <div className="client-specs">
                  <span><Bed size={15} /> {p.bedrooms} quartos</span>
                  <span><Bath size={15} /> {p.bathrooms} banheiros</span>
                  <span><Ruler size={15} /> {p.area}m²</span>
                  <span><Car size={15} /> {p.vagas} vagas</span>
                </div>
                {p.description && <p className="client-description">{p.description}</p>}
                {p.features && p.features.length > 0 && (
                  <div className="client-features">
                    {p.features.map((f, i) => <span key={i} className="feature-tag">{f}</span>)}
                  </div>
                )}
                <a className="btn-primary whatsapp-btn" href={whatsappLink(p)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} /> Tenho interesse
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState('landing');
  const [settings, setSettings] = useState({ teamPasscode: 'equipe2026', agencyName: 'Alpha Imóveis', whatsappNumber: '' });
  const [properties, setProperties] = useState([]);
  const [selections, setSelections] = useState([]);
  const [corretorName, setCorretorName] = useState(() => {
    try { return localStorage.getItem('corretorName') || ''; } catch (e) { return ''; }
  });

  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const [teamTab, setTeamTab] = useState('imoveis');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showSold, setShowSold] = useState(false);

  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [newSelectionResult, setNewSelectionResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [clientSelection, setClientSelection] = useState(null);
  const [cameFromTeam, setCameFromTeam] = useState(false);
  const [photoIdx, setPhotoIdx] = useState({});

  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(false);
    let settingsReady = false, propsReady = false, selsReady = false;
    function checkReady() { if (mounted && settingsReady && propsReady && selsReady) setLoading(false); }

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

    return () => { mounted = false; unsubProps(); unsubSels(); };
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

  async function handleSaveProperty(property) {
    const exists = properties.some(p => p.id === property.id);
    const withMeta = { ...property, lastEditedBy: corretorName || 'Equipe', lastEditedAt: Date.now() };
    try {
      await saveProperty(withMeta);
      showToast(exists ? 'Imóvel atualizado.' : 'Imóvel adicionado ao catálogo.');
    } catch (e) {
      showToast('Não foi possível salvar o imóvel. Verifique sua conexão.');
    }
    setShowPropertyForm(false);
    setEditingProperty(null);
  }

  async function handleDuplicateProperty(property) {
    const dup = {
      ...property,
      id: uid(),
      title: property.title + ' (cópia)',
      status: 'disponivel',
      createdAt: Date.now(),
      lastEditedBy: corretorName || 'Equipe',
      lastEditedAt: Date.now(),
    };
    try { await saveProperty(dup); showToast('Imóvel duplicado.'); }
    catch (e) { showToast('Não foi possível duplicar o imóvel.'); }
  }

  async function handleQuickStatusChange(property, newStatus) {
    try {
      await saveProperty({ ...property, status: newStatus, lastEditedBy: corretorName || 'Equipe', lastEditedAt: Date.now() });
      showToast(`Status atualizado para ${STATUS_CONFIG[newStatus].label}.`);
    } catch (e) {
      showToast('Não foi possível atualizar o status.');
    }
  }

  async function handleCreateSelection({ clientName, note, propertyIds }) {
    const code = generateCode(selections.map(s => s.id));
    const sel = { id: code, clientName, note, propertyIds, createdAt: Date.now() };
    try {
      await saveSelection(sel);
      setShowSelectionForm(false);
      setNewSelectionResult(sel);
    } catch (e) {
      showToast('Não foi possível criar a seleção.');
    }
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
      <div className="re-app">
        <div className="loading-screen"><Loader2 className="spin" size={26} /> <span>Carregando catálogo...</span></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="re-app">
        <div className="loading-screen" style={{ flexDirection: 'column', gap: 16 }}>
          <AlertCircle size={26} />
          <span>Não foi possível conectar ao banco de dados.</span>
          <button className="btn-primary" onClick={reloadPage}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="re-app">
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
              <button className={teamTab === 'imoveis' ? 'active' : ''} onClick={() => setTeamTab('imoveis')}>Imóveis</button>
              <button className={teamTab === 'selecoes' ? 'active' : ''} onClick={() => setTeamTab('selecoes')}>Seleções</button>
              <button className={teamTab === 'config' ? 'active' : ''} onClick={() => setTeamTab('config')}>Configurações</button>
            </nav>
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
                <button className="btn-primary" onClick={() => { setEditingProperty(null); setShowPropertyForm(true); }}>
                  <Plus size={16} /> Novo imóvel
                </button>
              </div>

              {filteredProperties.length === 0 ? (
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
                      onStatusChange={handleQuickStatusChange} />
                  ))}
                </div>
              )}
            </div>
          )}

          {teamTab === 'selecoes' && (
            <div className="team-content">
              <div className="toolbar">
                <div style={{ flex: 1 }} />
                <button className="btn-primary" onClick={() => setShowSelectionForm(true)}>
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
                          <button className="icon-btn danger" onClick={() => setConfirmDelete({ kind: 'selection', item: sel })} aria-label="Excluir"><Trash2 size={15} /></button>
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
                <label className="field"><span>Seu nome (aparece como "editado por" nos imóveis)</span>
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
        />
      )}

      {showPropertyForm && (
        <PropertyForm
          initial={editingProperty}
          onSave={handleSaveProperty}
          onClose={() => { setShowPropertyForm(false); setEditingProperty(null); }}
        />
      )}

      {showSelectionForm && (
        <SelectionForm properties={properties} onCreate={handleCreateSelection} onClose={() => setShowSelectionForm(false)} />
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
              <p>{confirmDelete.kind === 'property' ? `Excluir o imóvel "${confirmDelete.item.title}"?` : `Excluir a seleção de "${confirmDelete.item.clientName}"?`}</p>
              <p className="muted-small">Essa ação não pode ser desfeita.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger" onClick={async () => {
                try {
                  if (confirmDelete.kind === 'property') {
                    await deleteProperty(confirmDelete.item.id);
                    showToast('Imóvel removido.');
                  } else {
                    await deleteSelection(confirmDelete.item.id);
                    showToast('Seleção removida.');
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
