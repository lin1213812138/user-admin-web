/** 初始化数据模块：四个分类标签页枚举 */

/** 四个业务标签页定义（key 对应 InitDataCategory，文案走 i18n） */
export interface InitDataCategoryTab {
  key: Api.SystemManage.InitDataCategory;
  titleKey: App.I18n.I18nKey;
}

export const initDataCategoryTabs: InitDataCategoryTab[] = [
  { key: 'channel', titleKey: 'page.manage.setting.initData.channel' },
  { key: 'network', titleKey: 'page.manage.setting.initData.network' },
  { key: 'bubble', titleKey: 'page.manage.setting.initData.bubble' },
  { key: 'operation', titleKey: 'page.manage.setting.initData.operation' }
];
