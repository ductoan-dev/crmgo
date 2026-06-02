import React from 'react';
import { fmt, fmtDate } from '../../utils/helpers';

function SupplierCard({ sup, onEdit, onDelete }) {
  return (
    <div className="card card-pad" style={{ marginBottom:10, borderLeft:'4px solid #0d9488' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          background:'linear-gradient(135deg,#0d9488,#059669)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        }}>🏭</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{sup.name}</span>
            <code style={{
              fontSize:11, fontWeight:700, color:'#0d9488',
              background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'1px 7px',
            }}>@{sup.username}</code>
          </div>
          {(sup.phone || sup.email) && (
            <div style={{ fontSize:12, color:'#64748b', marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
              {sup.phone && <span>📞 {sup.phone}</span>}
              {sup.email && <span>✉️ {sup.email}</span>}
            </div>
          )}
          {Array.isArray(sup.cats) && sup.cats.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
              {sup.cats.map(c => (
                <span key={c} style={{
                  fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:99,
                  background:'#f0fdfa', color:'#0d9488', border:'1px solid #99f6e4',
                }}>{c}</span>
              ))}
            </div>
          )}
          {sup.areas?.length > 0 ? (
            <div style={{ marginTop:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#7c3aed', marginRight:5 }}>📍 KV:</span>
              {sup.areas.slice(0, 6).map(a => (
                <span key={a} style={{
                  fontSize:10, padding:'1px 7px', borderRadius:99, marginRight:4,
                  background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe',
                }}>{a}</span>
              ))}
              {sup.areas.length > 6 && (
                <span style={{ fontSize:10, color:'#94a3b8' }}>+{sup.areas.length - 6} tỉnh</span>
              )}
            </div>
          ) : (
            <div style={{ marginTop:4, fontSize:10, color:'#94a3b8' }}>📍 Toàn quốc</div>
          )}
          {(sup.company || sup.taxCode) && (
            <div style={{ fontSize:11, color:'#475569', marginTop:5, display:'flex', gap:12, flexWrap:'wrap' }}>
              {sup.company && <span>🏢 {sup.company}</span>}
              {sup.taxCode && <span style={{ color:'#7c3aed' }}>📄 MST: {sup.taxCode}</span>}
            </div>
          )}
          {sup.workshopAddress && (
            <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>
              🏭 {sup.workshopAddress}
            </div>
          )}
          {sup.note && (
            <div style={{ fontSize:11, color:'#64748b', marginTop:4, fontStyle:'italic' }}>{sup.note}</div>
          )}
          {(sup.rating > 0 || sup.ratingPros || sup.ratingCons) && (
            <div style={{ marginTop:8 }}>
              {sup.rating > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:2, marginBottom:4 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize:16, lineHeight:1, color: s <= sup.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                  ))}
                  <span style={{ fontSize:11, color:'#94a3b8', marginLeft:5 }}>{sup.rating}/5</span>
                </div>
              )}
              {(sup.ratingPros || sup.ratingCons) && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {sup.ratingPros && (
                    <span style={{
                      fontSize:11, color:'#16a34a', background:'#f0fdf4',
                      border:'1px solid #bbf7d0', borderRadius:99, padding:'2px 9px',
                    }}>✅ {sup.ratingPros}</span>
                  )}
                  {sup.ratingCons && (
                    <span style={{
                      fontSize:11, color:'#b91c1c', background:'#fef2f2',
                      border:'1px solid #fecaca', borderRadius:99, padding:'2px 9px',
                    }}>⚠️ {sup.ratingCons}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(sup)}>✏️ Sửa</button>
          <button
            className="btn btn-sm"
            style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}
            onClick={() => onDelete(sup)}
          >🗑️ Xoá</button>
        </div>
      </div>
    </div>
  );
}

export default SupplierCard;
