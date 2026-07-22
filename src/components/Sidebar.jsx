import React from 'react';
import {
  LayoutDashboard, Users, KanbanSquare, CalendarDays, Home as HomeIcon,
  ClipboardList, UsersRound, BarChart3, Settings, HelpCircle, Sun, Moon, LogOut
} from 'lucide-react';
import { LogoMark } from '../PropertyViews.jsx';

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', Icon: KanbanSquare },
  { id: 'clientes', label: 'Clientes', Icon: Users, soon: true },
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays, soon: true },
  { id: 'imoveis', label: 'Imóveis', Icon: HomeIcon },
  { id: 'selecoes', label: 'Seleções', Icon: ClipboardList },
  { id: 'equipe', label: 'Equipe', Icon: UsersRound, soon: true },
  { id: 'relatorios', label: 'Relatórios', Icon: BarChart3, soon: true },
];

export default function Sidebar({ activeTab, onNavigate, agencyName, corretorName, theme, onToggleTheme, onExit }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><LogoMark size={20} /> <span>{agencyName}</span></div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.Icon size={17} />
            <span>{item.label}</span>
            {item.soon && <em className="sidebar-soon">em breve</em>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`sidebar-item ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => onNavigate('config')}
        >
          <Settings size={17} /><span>Configurações</span>
        </button>
        <button className="sidebar-item" onClick={() => onNavigate('ajuda')}>
          <HelpCircle size={17} /><span>Ajuda</span><em className="sidebar-soon">em breve</em>
        </button>

        <div className="sidebar-divider" />

        <div className="sidebar-user">
          <span className="sidebar-user-name">{corretorName || 'Corretor'}</span>
          <div className="sidebar-user-actions">
            <button className="icon-btn" onClick={onToggleTheme} aria-label="Alternar tema">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button className="icon-btn" onClick={onExit} aria-label="Sair"><LogOut size={14} /></button>
          </div>
        </div>
      </div>
    </aside>
  );
}
