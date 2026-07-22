import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Bed, Bath, Car, Ruler, MapPin, Search, Plus, X, Check, Copy,
  Share2, Lock, ArrowLeft, Pencil, Trash2, Image as ImageIcon,
  MessageCircle, ClipboardList, Users, ChevronRight,
  ChevronLeft, Loader2, AlertCircle, Eye, EyeOff, CopyPlus, UserPlus, Sun, Moon
} from 'lucide-react';
import { uploadToCloudinary, cloudinaryResize } from './cloudinary.js';
import { formatPrice, uid, daysOnMarket, normalizePhone, formatPhoneDisplay } from './helpers.js';
import { GoogleMapView } from './MapView.jsx';

export const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', textColor: '#6EE7B7', bg: 'rgba(52,211,153,0.14)', dot: '#34D399' },
  reservado:  { label: 'Reservado',  textColor: '#FCD34D', bg: 'rgba(251,191,36,0.14)', dot: '#FBBF24' },
  vendido:    { label: 'Vendido',    textColor: '#9CA3AF', bg: 'rgba(156,163,175,0.14)', dot: '#9CA3AF' },
};

export function LogoMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 21H2L12 2Z" fill="currentColor" />
    </svg>
  );
}

export function WatermarkTriangle() {
  return (
    <svg className="watermark-triangle" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L22 21H2L12 2Z" fill="currentColor" />
    </svg>
  );
}

export function StatusStamp({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disponivel;
  return (
    <span className="status-pill" style={{ color: cfg.textColor, background: cfg.bg }}>
      <span className="status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function StatusQuickSelect({ status, onChange }) {
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

export function PhotoThumb({ src, fallbackSrc, alt, className, onClick }) {
  const [stage, setStage] = useState('primary'); // primary | fallback | error
  useEffect(() => { setStage('primary'); }, [src]);
  const showSrc = stage === 'error' ? null : (stage === 'fallback' ? fallbackSrc : src);
  return (
    <div className={`photo-thumb ${className || ''}`} onClick={onClick}>
      <div className="photo-fallback"><Home size={26} strokeWidth={1.5} /></div>
      {showSrc && (
        <img
          src={showSrc}
          alt={alt || ''}
          onError={() => {
            if (stage === 'primary' && fallbackSrc && fallbackSrc !== src) setStage('fallback');
            else setStage('error');
          }}
        />
      )}
    </div>
  );
}

export function PhotoLightbox({ property, onClose }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const photos = property.photos || [];

  function next() { setIdx(i => (i + 1) % photos.length); }
  function prev() { setIdx(i => (i - 1 + photos.length) % photos.length); }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  if (photos.length === 0) return null;

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) { delta > 0 ? prev() : next(); }
    touchStartX.current = null;
  }

  return (
    <div className="modal-overlay lightbox-overlay" onClick={onClose}>
      <button className="icon-btn lightbox-close" onClick={onClose}><X size={18} /></button>
      <div className="lightbox-body" onClick={e => e.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <PhotoThumb src={cloudinaryResize(photos[idx], 1400)} fallbackSrc={photos[idx]} alt={property.title} className="lightbox-photo" />
        {photos.length > 1 && (
          <>
            <button className="carousel-btn left" onClick={prev}><ChevronLeft size={20} /></button>
            <button className="carousel-btn right" onClick={next}><ChevronRight size={20} /></button>
            <div className="carousel-dots">
              {photos.map((_, i) => <span key={i} className={i === idx ? 'dot active' : 'dot'} />)}
            </div>
          </>
        )}
      </div>
      <p className="lightbox-title">{property.title} · {idx + 1}/{photos.length}</p>
    </div>
  );
}

export function PropertyCard({ property, onEdit, onDelete, onDuplicate, onStatusChange, onViewPhotos }) {
  const rawPhoto = property.photos && property.photos[0];
  const thumb = rawPhoto ? cloudinaryResize(rawPhoto, 400) : '';
  const days = daysOnMarket(property.createdAt);
  const hasPhotos = property.photos && property.photos.length > 0;
  return (
    <div className="prop-card">
      <PhotoThumb
        src={thumb}
        fallbackSrc={rawPhoto}
        alt={property.title}
        className={`prop-card-photo ${hasPhotos ? 'clickable' : ''}`}
        onClick={hasPhotos ? () => onViewPhotos(property) : undefined}
      />
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

export function PropertyForm({ initial, onSave, onClose }) {
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
    latitude: initial?.latitude ?? '',
    longitude: initial?.longitude ?? '',
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
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
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
            <span className="section-label"><MapPin size={14} /> Localização real (opcional)</span>
            <p className="field-hint">Abra o Google Maps, ache o endereço, clique com o botão direito no ponto exato e clique no que aparece com os números (isso copia as coordenadas). Cole aqui.</p>
            <div className="form-grid">
              <label className="field"><span>Latitude</span>
                <input value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="-5.7945" />
              </label>
              <label className="field"><span>Longitude</span>
                <input value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="-35.2110" />
              </label>
            </div>
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

// A seleção agora pode se vincular a um lead do CRM — nenhum, um já existente,
// ou um novo lead criado na hora (fecha o elo entre catálogo e CRM).
export function SelectionForm({ properties, leads, onCreate, onClose, presetClientName, presetLeadId }) {
  const [clientName, setClientName] = useState(presetClientName || '');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [linkMode, setLinkMode] = useState(presetLeadId ? 'existing' : 'none');
  const [linkedLeadId, setLinkedLeadId] = useState(presetLeadId || '');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [leadSearch, setLeadSearch] = useState('');

  const filtered = properties.filter(p =>
    p.status !== 'vendido' &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || (p.bairro || '').toLowerCase().includes(search.toLowerCase()))
  );
  const filteredLeads = (leads || []).filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase()));

  function toggle(id) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function handleSubmit() {
    if (!clientName.trim()) { setError('Dê um nome para identificar o cliente.'); return; }
    if (selected.length === 0) { setError('Escolha pelo menos um imóvel.'); return; }
    if (linkMode === 'new' && !newLeadPhone.trim()) { setError('Informe o telefone do novo lead.'); return; }
    onCreate({
      clientName: clientName.trim(), note: note.trim(), propertyIds: selected,
      leadLink: linkMode === 'none' ? null : linkMode === 'existing'
        ? { mode: 'existing', leadId: linkedLeadId }
        : { mode: 'new', name: clientName.trim(), phone: newLeadPhone.trim() },
    });
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

          {!presetLeadId && (
            <div className="lead-link-box">
              <span className="section-label"><UserPlus size={14} /> Vincular a um lead (opcional)</span>
              <div className="lead-link-tabs">
                <button type="button" className={linkMode === 'none' ? 'active' : ''} onClick={() => setLinkMode('none')}>Nenhum</button>
                <button type="button" className={linkMode === 'existing' ? 'active' : ''} onClick={() => setLinkMode('existing')}>Lead existente</button>
                <button type="button" className={linkMode === 'new' ? 'active' : ''} onClick={() => setLinkMode('new')}>Criar novo lead</button>
              </div>
              {linkMode === 'existing' && (
                <div className="lead-link-existing">
                  <div className="mini-search"><Search size={13} />
                    <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Buscar lead..." />
                  </div>
                  <div className="lead-pick-list">
                    {filteredLeads.length === 0 && <p className="empty-hint">Nenhum lead encontrado.</p>}
                    {filteredLeads.map(l => (
                      <label key={l.id} className={`select-row ${linkedLeadId === l.id ? 'checked' : ''}`}>
                        <input type="radio" name="leadpick" checked={linkedLeadId === l.id} onChange={() => setLinkedLeadId(l.id)} />
                        <div className="select-row-info"><strong>{l.name}</strong><span>{formatPhoneDisplay(l.phone)}</span></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {linkMode === 'new' && (
                <label className="field"><span>Telefone do novo lead</span>
                  <input value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} placeholder="(84) 99999-9999" />
                </label>
              )}
            </div>
          )}

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
                <PhotoThumb src={p.photos && p.photos[0] ? cloudinaryResize(p.photos[0], 200) : ''} fallbackSrc={p.photos && p.photos[0]} alt="" className="select-row-thumb" />
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

export function LandingView({ onTeam, onClient }) {
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
          <p>Gerenciar imóveis, leads e seleções</p>
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

export function GateScreen({ title, description, value, onChange, onSubmit, error, onBack, placeholder, uppercase }) {
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

export function ClientView({ agencyName, selection, properties, photoIdx, onNext, onPrev, onExit, whatsappLink, theme, onToggleTheme }) {
  return (
    <div className="client-view">
      <header className="client-header">
        <button className="back-link light" onClick={onExit}><ArrowLeft size={15} /> Sair</button>
        <div className="brand"><LogoMark size={18} /> <span>{agencyName}</span></div>
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
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
          let touchStartX = null;
          function handleTouchStart(e) { touchStartX = e.touches[0].clientX; }
          function handleTouchEnd(e) {
            if (touchStartX === null || photos.length <= 1) return;
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(delta) > 40) { delta > 0 ? onPrev(p.id, photos.length) : onNext(p.id, photos.length); }
            touchStartX = null;
          }
          return (
            <div className="client-card" key={p.id}>
              <div className="client-carousel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <PhotoThumb src={photos[idx] ? cloudinaryResize(photos[idx], 1000) : ''} fallbackSrc={photos[idx]} alt={p.title} className="client-photo" />
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
                {p.latitude && p.longitude && (
                  <div className="client-map">
                    <GoogleMapView markers={[{ id: p.id, lat: p.latitude, lng: p.longitude, label: p.title }]} height={200} zoom={15} />
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
