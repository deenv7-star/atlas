// Today desktop (home/var-combo, 05.11.2026, Deen's pick): A6 "המספר של החודש" with A4's sentence inside the card (the dock goes,
// so no number is said twice). The phone (<1024) renders ./MobileToday instead (M1/M2), see Dashboard.jsx.
import React from 'react';
import A6 from './VarA6';

export const HOME_VAR = 'a6';
export const HIDE_PHOTO = false;
export const HIDE_TILES = true;
export const HIDE_CHART = true;

export default function HomeTop(props) { return <A6 {...props} sentence />; }
