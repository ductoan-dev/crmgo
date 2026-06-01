import React, { useEffect } from 'react';
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

export default function AppShell() {
  const user                = useAuthStore(s => s.user);
  const checkOverdueLeads      = useDataStore(s => s.checkOverdueLeads);
  const checkOverdueOrders     = useDataStore(s => s.checkOverdueOrders);
  const checkNccQuoteDeadline  = useDataStore(s => s.checkNccQuoteDeadline);
  const setTab              = useUIStore(s => s.setTab);
  const activeTab           = useUIStore(s => s.activeTab);

  useEffect(() => {
    // Áp dụng màu role
    if (user?.role) {
      document.documentElement.style.setProperty(
        '--role-color',
        ROLE_COLOR[user.role] || 'var(--primary)'
      );
      document.body.className = `role-${user.role}`;
    }

    // Check quá hạn ngay sau khi mount (dữ liệu đã load từ LoginScreen/App.jsx)
    const initCheck = setTimeout(() => {
      checkOverdueLeads(user);
      checkOverdueOrders(user);
      checkNccQuoteDeadline(user);
    }, 800);

    // 🧪 TEST: check mỗi 30 giây | Production: mỗi 15 phút
    const CHECK_MS  = import.meta.env.DEV ? 30_000 : 15 * 60 * 1000;
    const interval  = setInterval(() => {
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
