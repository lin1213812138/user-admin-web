import type { Component } from 'vue';
import * as IonIcons5 from '@vicons/ionicons5';
import * as Antd from '@vicons/antd';

/** curated iconify icon names for the menu icon picker.
 *  offline-friendly; extend by appending more `collection:name` strings. */
export const iconifyIcons: string[] = [
  'mdi:home',
  'mdi:menu',
  'mdi:view-dashboard',
  'mdi:view-dashboard-outline',
  'mdi:cog',
  'mdi:cog-outline',
  'mdi:settings',
  'mdi:gear',
  'mdi:account',
  'mdi:account-circle',
  'mdi:account-group',
  'mdi:account-multiple',
  'mdi:account-key',
  'mdi:lock',
  'mdi:lock-outline',
  'mdi:key',
  'mdi:key-outline',
  'mdi:shield',
  'mdi:shield-account',
  'mdi:shield-key',
  'mdi:file-document',
  'mdi:file-cog',
  'mdi:folder',
  'mdi:folder-outline',
  'mdi:folder-network',
  'mdi:clipboard-list',
  'mdi:clipboard-text',
  'mdi:format-list-bulleted',
  'mdi:format-list-checkbox',
  'mdi:view-list',
  'mdi:table',
  'mdi:chart-bar',
  'mdi:chart-line',
  'mdi:chart-pie',
  'mdi:chart-box',
  'mdi:bell',
  'mdi:bell-outline',
  'mdi:email',
  'mdi:email-outline',
  'mdi:message',
  'mdi:message-text',
  'mdi:cart',
  'mdi:cart-outline',
  'mdi:store',
  'mdi:storefront',
  'mdi:package',
  'mdi:package-variant',
  'mdi:tag',
  'mdi:tag-outline',
  'mdi:truck',
  'mdi:truck-delivery',
  'mdi:warehouse',
  'mdi:box',
  'mdi:box-outline',
  'mdi:archive',
  'mdi:book',
  'mdi:book-open',
  'mdi:bookshelf',
  'mdi:database',
  'mdi:server',
  'mdi:server-network',
  'mdi:cloud',
  'mdi:api',
  'mdi:code',
  'mdi:code-tags',
  'mdi:console',
  'mdi:monitor',
  'mdi:monitor-dashboard',
  'mdi:cellphone',
  'mdi:devices',
  'mdi:web',
  'mdi:link',
  'mdi:plus',
  'mdi:plus-circle',
  'mdi:pencil',
  'mdi:pencil-outline',
  'mdi:delete',
  'mdi:delete-outline',
  'mdi:content-save',
  'mdi:check',
  'mdi:check-circle',
  'mdi:close',
  'mdi:close-circle',
  'mdi:star',
  'mdi:star-outline',
  'mdi:heart',
  'mdi:flag',
  'mdi:map-marker',
  'mdi:earth',
  'mdi:gift',
  'mdi:currency-cny',
  'mdi:cash',
  'mdi:cash-multiple',
  'mdi:chart-areaspline',
  'mdi:calendar',
  'mdi:calendar-clock',
  'mdi:clock',
  'mdi:history',
  'mdi:information',
  'mdi:help-circle',
  'mdi:alert',
  'mdi:alert-circle',
  'mdi:bug',
  'mdi:tools',
  'mdi:wrench',
  'mdi:hammer-wrench',
  'mdi:logout',
  'mdi:login',
  'mdi:exit-to-app',
  'mdi:refresh',
  'mdi:sync',
  'mdi:download',
  'mdi:upload',
  'mdi:eye',
  'mdi:eye-off',
  'mdi:filter',
  'mdi:sort',
  'mdi:magnify',
  'mdi:dots-vertical',
  'mdi:dots-horizontal',
  'mdi:grid',
  'mdi:grid-large',
  'mdi:layers',
  'mdi:shape',
  'mdi:image',
  'mdi:image-outline',
  'mdi:music',
  'mdi:video',
  'mdi:microphone',
  'mdi:phone',
  'mdi:contacts',
  'mdi:badge-account',
  'mdi:certificate',
  'mdi:award',
  'mdi:thumb-up',
  'mdi:thumb-down'
];

/** vicons collection id, extend by adding a new entry to `viconsCollections` */
export type ViconsCollectionId = 'ionicons5' | 'antd';

export interface ViconsCollection {
  id: ViconsCollectionId;
  /** display label (brand name, shared across locales) */
  label: string;
  /** map of icon component name -> Vue component */
  icons: Record<string, Component>;
}

/** @vicons collections available in the picker.
 *  NOTE: each `import * as` pulls the whole set into the bundle (no tree-shaking),
 *  so only add collections you actually need. */
export const viconsCollections: ViconsCollection[] = [
  { id: 'ionicons5', label: 'Ionicons 5', icons: IonIcons5 as unknown as Record<string, Component> },
  { id: 'antd', label: 'Ant Design', icons: Antd as unknown as Record<string, Component> }
];

/** prefix used to store a vicons icon in a single string, e.g. "vicons:ionicons5:Home" */
export const VICONS_PREFIX = 'vicons:';

export type IconSource = 'iconify' | ViconsCollectionId;

export interface IconEntry {
  /** stored value (iconify name or `vicons:<collection>:<Name>`) */
  key: string;
  /** display/search name */
  name: string;
  /** which source/tab this icon belongs to */
  source: IconSource;
}
