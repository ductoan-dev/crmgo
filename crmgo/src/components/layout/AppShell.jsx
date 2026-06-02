import React, { useEffect, useCallback } from 'react';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { ROLE_COLOR } from '../../utils/constants';
import Topbar from './Topbar';
import TabBar  from './TabBar';
import ModalContainer from '../modals/ModalContainer';

// Role views
import SalesView   from '../sales/SalesView';
import SmgrView    from '../smgr/SmgrView';
import KetoanView  from '../ketoan/KetoanView';
import ProdView    from '../prod/ProdView';
import AdminView   from '../admin/AdminView';
import DesignView  from '../design/DesignView';
import KhoView     from '../kho/KhoView';
import MktView     from '../mkt/MktView';
import CskhView    from '../shared/CskhView';

const ROLE_VIEW = {
  sales:  SalesView,
  mkt:    MktView,
  cskh:   CskhView,
  ketoan: KetoanView,
  design: DesignView,
  kho:    KhoView,
  smgr:   SmgrView,
  prod:   ProdView,
  admin:  AdminView,
};

const ROLE_DEFAULT_TAB = {
  sales:  'leads',    mkt:    'leads',   cskh:   'customers',
  ketoan: 'approve',  design: 'orders',  kho:    'orders',
  smgr:   'orders',   prod:   'list',    admin:  'dash',
};

const ROLE_VALID_TABS = {
  sales:  ['leads','opps','orders','mycust','report'],
  mkt:    ['leads','data','report'],
  cskh:   ['customers'],
  ketoan: ['approve','orders','report'],
  design: ['orders','assign'],
  kho:    ['orders','stock'],
  smgr:   ['orders','suppliers','report','ai'],
  prod:   ['list','status','dash'],
  admin:  ['dash','users','piigo','biz'],
};

// Dev: 30s | Prod: 5 phút
const POLL_MS  = import.meta.env.DEV ? 30_000  : 5  * 60_000;
const CHECK_MS = import.meta.env.DEV ? 30_000  : 15 * 60_000;

export default function AppShell() {
  const user                   = useAuthStore(s => s.user);
  const useApi                 = useAuthStore(s => s.useApi);
  const load                   = useDataStore(s => s.load);
  const checkOverdueLeads      = useDataStore(s => s.checkOverdueLeads);
  const checkOverdueOrders     = useDataStore(s => s.checkOverdueOrders);
  const checkNccQuoteDeadline  = useDataStore(s => s.checkNccQuoteDeadline);
  const setTab                 = useUIStore(s => s.setTab);
  const activeTab              = useUIStore(s => s.activeTab);

  // ── Auto-refresh: polling khi ở API mode ──────────────────
  useEffect(() => {
    if (!user || !useApi) return;
    const poll = setInterval(() => load(), POLL_MS);
    return () => clearInterval(poll);
  }, [user?.role, useApi]);

  useEffect(() => {
    if (!user?.role) return;

    // Áp dụng màu role
    document.documentElement.style.setProperty(
      '--role-color',
      ROLE_COLOR[user.role] || 'var(--primary)'
    );
    document.body.className = `role-${user.role}`;

    // Reset tab nếu tab hiện tại không thuộc role này
    const validTabs = ROLE_VALID_TABS[user.role] || [];
    if (!validTabs.includes(activeTab)) {
      setTab(ROLE_DEFAULT_TAB[user.role] || 'leads');
    }

    // Check quá hạn ngay sau khi mount
    const initCheck = setTimeout(() => {
      checkOverdueLeads(user);
      checkOverdueOrders(user);
      checkNccQuoteDeadline(user);
    }, 800);

    const interval = setInterval(() => {
      checkOverdueLeads(user);
      checkOverdueOrders(user);
      checkNccQuoteDeadline(user);
    }, CHECK_MS);

    return () => {
      clearTimeout(initCheck);
      clearInterval(interval);
    };
  }, [user?.role]);

  const RoleView = ROLE_VIEW[user?.role] || SalesView;

  return (
    <div className="app-shell">
      <Topbar />
      <div className="main-content">
        <TabBar />
        <div className="page-wrap">
          <RoleView activeTab={activeTab} setTab={setTab} />
        </div>
      </div>
      <ModalContainer />
    </div>
  );
}
