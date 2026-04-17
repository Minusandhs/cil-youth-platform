// ================================================================
// useConstants — fetches dropdown options from GET /api/constants
// and caches them for the lifetime of the browser session.
//
// Components get the server-authoritative lists for all dropdowns.
// Static values from constants.js are used as the instant fallback
// so no loading spinners are needed — the UI renders immediately
// with the correct values, then silently refreshes from the API.
// ================================================================
import { useState, useEffect } from 'react';
import api from './api';
import {
  MARITAL_STATUS,
  LANG_LEVELS, INST_TYPES, PLAN_STATUSES,
  AL_STREAMS, AL_MEDIUMS,
} from './constants';

// Static values used as initial state so components render instantly
const STATIC_DEFAULTS = {
  currentStatuses : [
    { value: 'studying_school',         label: 'Studying — School' },
    { value: 'studying_tertiary',       label: 'Studying — Tertiary' },
    { value: 'studying_vocational',     label: 'Studying — Vocational' },
    { value: 'studying_completed_exam', label: 'Studying — Completed Examination' },
    { value: 'studying_waiting_result', label: 'Studying — Waiting For the Result' },
    { value: 'employed_full',           label: 'Employed — Full Time' },
    { value: 'employed_part',           label: 'Employed — Part Time' },
    { value: 'self_employed',           label: 'Self Employed' },
    { value: 'unemployed_seeking',      label: 'Unemployed — Seeking' },
    { value: 'unemployed_not',          label: 'NEET - Not in Education, Employment and Training' },
    { value: 'other',                   label: 'Other' },
  ],
  maritalStatuses  : MARITAL_STATUS,
  outsidePurposes  : [
    { value: 'Study',           label: 'Study'           },
    { value: 'Work / Business', label: 'Work / Business' },
    { value: 'Other',           label: 'Other'           },
  ],
  instTypes        : INST_TYPES,
  langLevels       : LANG_LEVELS,
  alStreams         : AL_STREAMS.map(s => ({ value: s, label: s })),
  alMediums        : AL_MEDIUMS.map(s => ({ value: s, label: s })),
  planStatuses     : PLAN_STATUSES,
};

// Module-level cache — survives re-renders and component remounts
let cache = null;

export function useConstants() {
  const [options, setOptions] = useState(cache || STATIC_DEFAULTS);

  useEffect(() => {
    if (cache) {
      setOptions(cache);
      return;
    }
    api.get('/api/constants')
      .then(res => {
        cache = res.data;
        setOptions(cache);
      })
      .catch(() => {
        // API failed — static fallback already set, nothing to do
      });
  }, []);

  return options;
}
