// ══ Opportunity Service ════════════════════════════════════════

import { api } from '../utils/api';
import { fromApiOpp } from '../utils/mappers';
import { genCode } from '../utils/helpers';

export async function addOpp(opp, useApi) {
  if (useApi) {
    const created = await api.opps.create(opp);
    return fromApiOpp(created);
  }
  const now = new Date();
  return {
    id:      Date.now(),
    code:    genCode('OPP'),
    quotes:  [],
    dateObj: now,
    dateStr: now.toLocaleDateString('vi-VN'),
    timeStr: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    status:  0,
    khaNang: 50,
    images:  [],
    ...opp,
  };
}

export async function updateOpp(id, patch, useApi) {
  if (useApi) {
    await api.opps.update(id, patch);
  }
}
