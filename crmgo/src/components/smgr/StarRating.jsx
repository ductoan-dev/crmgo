import React, { useState } from 'react';

function StarRating({ value = 0, onChange, size = 22, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          onClick={() => !readonly && onChange(star === value ? 0 : star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: size, lineHeight:1,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= active ? '#f59e0b' : '#d1d5db',
            transition:'color .1s',
            userSelect:'none',
          }}
        >★</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize:11, color:'#94a3b8', marginLeft:6 }}>{value}/5</span>
      )}
      {!readonly && value === 0 && (
        <span style={{ fontSize:11, color:'#94a3b8', marginLeft:6 }}>Chưa đánh giá</span>
      )}
    </div>
  );
}

export default StarRating;
