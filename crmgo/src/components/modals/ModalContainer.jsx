import React, { useEffect } from 'react';
import { useUIStore } from '../../store';
import AddLeadModal  from './AddLeadModal';
import AddOppModal   from './AddOppModal';
import AddOrderModal from './AddOrderModal';

// Map modal type → component
const MODALS = {
  addLead:  AddLeadModal,
  addOpp:   AddOppModal,
  addOrder: AddOrderModal,
};

export default function ModalContainer() {
  const modal      = useUIStore(s => s.modal);
  const closeModal = useUIStore(s => s.closeModal);

  // Close on Escape
  useEffect(() => {
    if (!modal) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, closeModal]);

  if (!modal) return null;

  const ModalContent = MODALS[modal.type];
  if (!ModalContent) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={closeModal} aria-label="Đóng">✕</button>
        <ModalContent data={modal.data} />
      </div>
    </div>
  );
}
