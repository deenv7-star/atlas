/**
 * Layout direction switch. Branch feat/app-ui-a ships direction A ("calm light"),
 * feat/app-ui-b ships direction B ("rich hospitality"). Brand, type and copy are shared.
 */
import * as A from './a';
import * as B from './b';

// This branch ships direction B by default; set VITE_UI_DIRECTION to compare the other.
const DIRECTION = import.meta.env.VITE_UI_DIRECTION || 'b';
const D = DIRECTION === 'b' ? B : A;

export const Sidebar = D.Sidebar;
export const Header = D.Header;
export const TabBar = D.TabBar;
export const shellClass = D.shellClass;
export const DashboardView = D.DashboardView;
