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
  MARITAL_STATUS, OL_STATUS, AL_STATUS,
  LANG_LEVELS, INST_TYPES, PLAN_STATUSES,
  AL_STREAMS, AL_MEDIUMS,
} from './constants';

// Static values used as initial state so components render instantly
const STATIC_DEFAULTS = {
  currentStatuses : Object.entries(
    // Build from CURRENT_STATUS — filter out synthetic 'no_profile'
    (() => {
      // Inline import to avoid circular dep — mirrors server option list
      return {
        studying_school    : 'Studying — School',
        studying_tertiary  : 'Studying — Tertiary',
        studying_vocational: 'Studying — Vocational',
        employed_full      : 'Employed — Full Time',
        employed_part      : 'Employed — Part Time',
        self_employed      : 'Self Employed',
        unemployed_seeking : 'Unemployed — Seeking',
        unemployed_not     : 'NEET - Not in Education, Employment and Training',
        other              : 'Other',
      };
    })()
  ).map(([value, label]) => ({ value, label })),
  maritalStatuses  : MARITAL_STATUS,
  olStatuses       : OL_STATUS,
  alStatuses       : AL_STATUS,
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
