import React from 'react';
import { useAuthStore, useUIStore } from '../../store';

const TABS_BY_ROLE = {
  sales: [
    { key:'leads',   label:'Lead',       icon:'👥' },
    { key:'opps',    label:'Cơ hội',     icon:'⚡' },
    { key:'orders',  label:'Đơn hàng',   icon:'📋' },
    { key:'mycust',  label:'Khách hàng', icon:'🤝' },
    { key:'report',  label:'Báo cáo',    icon:'📊' },
  ],
  mkt: [
    { key:'leads',   label:'Lead',       icon:'👥' },
    { key:'data',    label:'Dữ liệu',    icon:'📈' },
    { key:'report',  label:'Báo cáo',    icon:'📊' },
  ],
  cskh: [
    { key:'customers', label:'Khách hàng', icon:'🤝' },
  ],
  ketoan: [
    { key:'approve', label:'Phê duyệt',  icon:'✅' },
    { key:'orders',  label:'Đơn hàng',   icon:'📋' },
    { key:'report',  label:'Báo cáo',    icon:'📊' },
  ],
  design: [
    { key:'orders',  label:'Đơn thiết kế', icon:'🎨' },
    { key:'assign',  label:'Phân công',    icon:'📌' },
  ],
  kho: [
    { key:'orders',  label:'Đơn hàng', icon:'📦' },
    { key:'stock',   label:'Tồn kho',  icon:'🏪' },
  ],
  smgr: [
    { key:'orders',    label:'Đơn hàng',    icon:'📋' },
    { key:'suppliers', label:'Nhà cung cấp',icon:'🏭' },
    { key:'report',    label:'Báo cáo',     icon:'📊' },
    { key:'ai',        label:'AI Báo giá',  icon:'🤖' },
  ],
  prod: [
    { key:'list',    label:'Cơ hội',     icon:'📋' },
    { key:'status',  label:'Tình trạng', icon:'✅' },
    { key:'dash',    label:'Dashboard',  icon:'📊' },
  ],
  admin: [
    { key:'dash',    label:'Dashboard', icon:'🏠' },
    { key:'users',   label:'Nhân sự',   icon:'👤' },
    { key:'piigo',   label:'Piigo',     icon:'🤖' },
    { key:'biz',     label:'Doanh nghiệp', icon:'🏢' },
  ],
};

export default function TabBar() {
  const user      = useAuthStore(s => s.user);
  const activeTab = useUIStore(s => s.activeTab);
  const setTab    = useUIStore(s => s.setTab);

  const tabs = TABS_BY_ROLE[user?.role] || [];

  if (tabs.length <= 1) return null;

  return (
    <div className="tabs-bar">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => setTab(tab.key)}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
