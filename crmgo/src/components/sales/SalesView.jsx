import React from 'react';
import { useUIStore } from '../../store';
import LeadsView    from './LeadsView';
import OppsView     from './OppsView';
import OrdersView   from './OrdersView';
import MyCustView   from './MyCustView';
import ReportView   from './ReportView';

export default function SalesView() {
  const activeTab = useUIStore(s => s.activeTab);

  return (
    <>
      {activeTab === 'leads'  && <LeadsView />}
      {activeTab === 'opps'   && <OppsView />}
      {activeTab === 'orders' && <OrdersView />}
      {activeTab === 'mycust' && <MyCustView />}
      {activeTab === 'report' && <ReportView />}
    </>
  );
}
