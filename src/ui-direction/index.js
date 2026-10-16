/**
 * Layout direction switch. Branch feat/app-ui-v4-a ships direction A ("Airbnb warm"),
 * feat/app-ui-v4-b ships direction B ("playful light"). Both are light; brand, type and copy are shared.
 */
import * as A from './a';
import * as B from './b';
import { DIRECTION } from './flag';

const D = DIRECTION === 'b' ? B : A;

export { DIRECTION };
export const Sidebar = D.Sidebar;
export const Header = D.Header;
export const TabBar = D.TabBar;
export const shellClass = D.shellClass;
export const DashboardView = D.DashboardView;
