const local: App.I18n.Schema = {
  system: {
    title: 'TMS 管理系统',
    updateTitle: '系统版本更新通知',
    updateContent: '检测到系统有新版本发布，是否立即刷新页面？',
    updateConfirm: '立即刷新',
    updateCancel: '稍后再说'
  },
  common: {
    action: '操作',
    expandFilter: '展开',
    collapseFilter: '收起',
    add: '新增',
    addSuccess: '添加成功',
    saveSuccess: '保存成功',
    backToHome: '返回首页',
    batchDelete: '批量删除',
    cancel: '取消',
    close: '关闭',
    check: '勾选',
    selectAll: '全选',
    unselectAll: '取消全选',
    expandColumn: '展开列',
    columnSetting: '列设置',
    config: '配置',
    confirm: '确认',
    drag: '拖拽',
    iconPicker: {
      placeholder: '请选择图标',
      clear: '清空',
      search: '搜索图标',
      empty: '无匹配图标',
      all: '全部',
      iconify: 'Iconify'
    },
    show: '显示',
    treeNodeColumnLocked: '树节点列不可隐藏',
    name: '名称',
    fixed: '固定',
    width: '宽度',
    minWidth: '最小宽度',
    sortable: '可排序',
    unFixed: '不固定',
    fixedLeft: '左固定',
    fixedRight: '右固定',
    delete: '删除',
    deleteSuccess: '删除成功',
    confirmDelete: '确认删除吗？',
    copy: '复制',
    copySuccess: '复制成功',
    copyFailed: '复制失败',
    createSuccess: '新增成功',
    detail: '详情',
    edit: '编辑',
    enable: '启用',
    disable: '禁用',
    warning: '警告',
    error: '错误',
    index: '序号',
    keywordSearch: '请输入关键词搜索',
    keyword: '关键词',
    status: '状态',
    remark: '备注',
    logout: '退出登录',
    logoutConfirm: '确认退出登录吗？',
    lookForward: '敬请期待',
    modify: '修改',
    modifySuccess: '修改成功',
    noData: '无数据',
    operate: '操作',
    pleaseCheckValue: '请检查输入的值是否合法',
    refresh: '刷新',
    reset: '重置',
    search: '搜索',
    switch: '切换',
    tip: '提示',
    trigger: '触发',
    update: '更新',
    updateSuccess: '更新成功',
    userCenter: '个人中心',
    yesOrNo: {
      yes: '是',
      no: '否'
    },
    devInProgress: '待开发',
    excelTemplate: '选择模板',
    export: '导出',
    exportFields: '导出字段',
    exportSelectedCount: '已选 {count} 项',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    exportScope: '数据范围',
    exportScopeAll: '全部数据',
    exportScopePage: '当前页（{count} 条）',
    exportScopeChecked: '勾选数据（{count} 条）',
    exportScopeCheckedEmpty: '请先勾选要导出的行',
    exportScopeAllUnavailable: '未配置全量取数',
    addField: '新增字段',
    customField: '自定义字段',
    fieldName: '字段名称',
    fieldNamePlaceholder: '请输入字段名称',
    dataField: '数据字段',
    dataFieldPlaceholder: '请输入数据字段名',
    valueMode: '取值方式',
    valueModeField: '取数据',
    valueModeFixed: '固定值',
    fixedValuePlaceholder: '请输入固定值'
  },
  request: {
    logout: '请求失败后登出用户',
    logoutMsg: '用户状态失效，请重新登录',
    logoutWithModal: '请求失败后弹出模态框再登出用户',
    logoutWithModalMsg: '用户状态失效，请重新登录',
    refreshToken: '请求的token已过期，刷新token',
    tokenExpired: 'token已过期'
  },
  theme: {
    themeDrawerTitle: '主题配置',
    tabs: {
      appearance: '外观',
      layout: '布局',
      general: '通用',
      preset: '预设'
    },
    appearance: {
      themeSchema: {
        title: '主题模式',
        light: '亮色模式',
        dark: '暗黑模式',
        auto: '跟随系统'
      },
      grayscale: '灰色模式',
      colourWeakness: '色弱模式',
      themeColor: {
        title: '主题颜色',
        primary: '主色',
        info: '信息色',
        success: '成功色',
        warning: '警告色',
        error: '错误色',
        followPrimary: '跟随主色'
      },
      themeRadius: {
        title: '主题圆角'
      },
      recommendColor: '应用推荐算法的颜色',
      recommendColorDesc: '推荐颜色的算法参照',
      preset: {
        title: '主题预设',
        apply: '应用',
        applySuccess: '预设应用成功',
        default: {
          name: '默认预设',
          desc: 'Soybean 默认主题预设'
        },
        dark: {
          name: '暗色预设',
          desc: '适用于夜间使用的暗色主题预设'
        },
        compact: {
          name: '紧凑型',
          desc: '适用于小屏幕的紧凑布局预设'
        },
        azir: {
          name: 'Azir的预设',
          desc: '是 Azir 比较喜欢的莫兰迪色系冷淡风'
        }
      }
    },
    layout: {
      layoutMode: {
        title: '布局模式',
        vertical: '左侧菜单模式',
        'vertical-mix': '左侧菜单混合模式',
        'vertical-hybrid-header-first': '左侧混合-顶部优先',
        horizontal: '顶部菜单模式',
        'top-hybrid-sidebar-first': '顶部混合-侧边优先',
        'top-hybrid-header-first': '顶部混合-顶部优先',
        vertical_detail: '左侧菜单布局，菜单在左，内容在右。',
        'vertical-mix_detail': '左侧双菜单布局，一级菜单在左侧深色区域，二级菜单在左侧浅色区域。',
        'vertical-hybrid-header-first_detail':
          '左侧混合布局，一级菜单在顶部，二级菜单在左侧深色区域，三级菜单在左侧浅色区域。',
        horizontal_detail: '顶部菜单布局，菜单在顶部，内容在下方。',
        'top-hybrid-sidebar-first_detail': '顶部混合布局，一级菜单在左侧，二级菜单在顶部。',
        'top-hybrid-header-first_detail': '顶部混合布局，一级菜单在顶部，二级菜单在左侧。'
      },
      tab: {
        title: '标签栏设置',
        visible: '显示标签栏',
        cache: '标签栏信息缓存',
        cacheTip: '离开页面后仍然保留标签栏信息',
        height: '标签栏高度',
        mode: {
          title: '标签栏风格',
          slider: '滑块风格',
          chrome: '谷歌风格',
          button: '按钮风格'
        },
        closeByMiddleClick: '鼠标中键关闭标签页',
        closeByMiddleClickTip: '启用后可以使用鼠标中键点击标签页进行关闭'
      },
      header: {
        title: '头部设置',
        height: '头部高度',
        breadcrumb: {
          visible: '显示面包屑',
          showIcon: '显示面包屑图标'
        }
      },
      sider: {
        title: '侧边栏设置',
        inverted: '深色侧边栏',
        width: '侧边栏宽度',
        collapsedWidth: '侧边栏折叠宽度',
        mixWidth: '混合布局侧边栏宽度',
        mixCollapsedWidth: '混合布局侧边栏折叠宽度',
        mixChildMenuWidth: '混合布局子菜单宽度',
        autoSelectFirstMenu: '自动选择第一个子菜单',
        autoSelectFirstMenuTip: '点击一级菜单时，自动选择并导航到第一个子菜单的最深层级',
        accordion: '侧边栏手风琴'
      },
      footer: {
        title: '底部设置',
        visible: '显示底部',
        fixed: '固定底部',
        height: '底部高度',
        right: '底部居右'
      },
      content: {
        title: '内容区域设置',
        scrollMode: {
          title: '滚动模式',
          tip: '主题滚动仅 main 部分滚动，外层滚动可携带头部底部一起滚动',
          wrapper: '外层滚动',
          content: '主体滚动'
        },
        page: {
          animate: '页面切换动画',
          mode: {
            title: '页面切换动画类型',
            'fade-slide': '滑动',
            fade: '淡入淡出',
            'fade-bottom': '底部消退',
            'fade-scale': '缩放消退',
            'zoom-fade': '渐变',
            'zoom-out': '闪现',
            none: '无'
          }
        },
        fixedHeaderAndTab: '固定头部和标签栏'
      }
    },
    general: {
      title: '通用设置',
      watermark: {
        title: '水印设置',
        visible: '显示全屏水印',
        text: '自定义水印文本',
        enableUserName: '启用用户名水印',
        enableTime: '显示当前时间',
        timeFormat: '时间格式'
      },
      multilingual: {
        title: '多语言设置',
        visible: '显示多语言按钮'
      },
      globalSearch: {
        title: '全局搜索设置',
        visible: '显示全局搜索按钮'
      }
    },
    configOperation: {
      copyConfig: '复制配置',
      copySuccessMsg: '复制成功，请替换 src/theme/settings.ts 中的变量 themeSettings',
      resetConfig: '重置配置',
      resetSuccessMsg: '重置成功'
    }
  },
  route: {
    login: '登录',
    403: '无权限',
    404: '页面不存在',
    500: '服务器错误',
    'iframe-page': '外链页面',
    home: '首页',
    'system-manage': '系统管理',
    'system-manage_user': '用户管理',
    'system-manage_role': '角色管理',
    'system-manage_menu': '菜单管理',
    'data-manage': '资料管理',
    'data-manage_basic': '基础资料',
    'data-manage_finance': '财务资料',
    'data-manage_business': '业务资料',
    'system-manage_setting': '系统设置'
  },
  page: {
    login: {
      common: {
        loginOrRegister: '登录 / 注册',
        userNamePlaceholder: '请输入用户名',
        phonePlaceholder: '请输入手机号',
        codePlaceholder: '请输入验证码',
        passwordPlaceholder: '请输入密码',
        confirmPasswordPlaceholder: '请再次输入密码',
        codeLogin: '验证码登录',
        confirm: '确定',
        back: '返回',
        validateSuccess: '验证成功',
        loginSuccess: '登录成功',
        welcomeBack: '欢迎回来，{userName} ！'
      },
      pwdLogin: {
        title: '密码登录',
        rememberMe: '记住我',
        forgetPassword: '忘记密码？',
        register: '注册账号',
        otherAccountLogin: '其他账号登录',
        otherLoginMode: '其他登录方式',
        superAdmin: '超级管理员',
        admin: '管理员',
        user: '普通用户'
      },
      codeLogin: {
        title: '验证码登录',
        getCode: '获取验证码',
        reGetCode: '{time}秒后重新获取',
        sendCodeSuccess: '验证码发送成功',
        imageCodePlaceholder: '请输入图片验证码'
      },
      register: {
        title: '注册账号',
        agreement: '我已经仔细阅读并接受',
        protocol: '《用户协议》',
        policy: '《隐私权政策》'
      },
      resetPwd: {
        title: '重置密码'
      },
      bindWeChat: {
        title: '绑定微信'
      }
    },
    manage: {
      user: {
        userName: '用户名',
        nickName: '昵称',
        userPhone: '手机号',
        userEmail: '邮箱',
        status: '状态',
        createTime: '创建时间',
        form: {
          userNamePlaceholder: '请输入用户名',
          nickNamePlaceholder: '请输入昵称',
          userPhonePlaceholder: '请输入手机号',
          userEmailPlaceholder: '请输入邮箱'
        }
      },
      role: {
        roleName: '角色名称',
        roleCode: '角色标识',
        remark: '角色描述',
        sort: '排序',
        status: '状态',
        createTime: '创建时间',
        permission: '分配权限',
        permissionTip: '勾选该角色可访问的菜单',
        form: {
          roleNamePlaceholder: '请输入角色名称',
          roleCodePlaceholder: '请输入角色标识',
          sortPlaceholder: '请输入排序值',
          statusPlaceholder: '请选择状态',
          remarkPlaceholder: '请输入角色描述'
        }
      },
      menu: {
        parentMenu: '上级菜单',
        topMenu: '顶级菜单',
        type: '菜单类型',
        catalog: '目录',
        menu: '菜单',
        menuName: '菜单名称',
        icon: '菜单图标',
        routePath: '路由地址',
        componentPath: '组件路径',
        permission: '权限标识',
        sort: '排序',
        status: '状态',
        visible: '是否可见',
        keepAlive: '是否缓存',
        isExternal: '是否外链',
        redirect: '重定向',
        createTime: '创建时间',
        addMenu: '新增菜单',
        editMenu: '编辑菜单',
        addSubMenu: '增加子菜单',
        form: {
          menuNamePlaceholder: '请输入菜单名称',
          iconPlaceholder: '请输入图标名称，如 mdi:home',
          routePlaceholder: '请输入路由地址，如 /system/menu',
          componentPlaceholder: '请输入组件路径，如 views/system-manage/menu/index.vue',
          permissionPlaceholder: '请输入权限标识，如 system:menu:list',
          redirectPlaceholder: '请输入重定向地址'
        }
      },
      setting: {
        inputFormat: '录单格式',
        printFormat: {
          title: '打印格式',
          listTitle: '打印格式类型',
          name: '模板名称',
          labelSize: '标签尺寸',
          isDefault: '是否默认',
          yes: '是',
          no: '否',
          generatedCount: '已生成标签',
          remark: '备注',
          lastEditor: '最后编辑',
          editTime: '编辑时间',
          create: '新建',
          delete: '删除',
          view: '查看',
          copy: '复制',
          setDefault: '设为默认',
          newTitle: '新建打印模板',
          detailTitle: '打印模板详情',
          copyTitle: '复制打印模板'
        },
        exportFormat: {
          title: '导出格式',
          listTitle: '导出格式类型',
          name: '模板名称',
          scope: '使用范围',
          scopeInternal: '内部系统',
          scopeCustomer: '客户',
          scopeAll: '全部',
          fileName: '上传模板',
          remark: '备注',
          lastEditor: '最后编辑',
          editTime: '编辑时间',
          create: '新建',
          delete: '删除',
          edit: '编辑',
          download: '下载模板',
          downloadFields: '字段模板下载',
          newTitle: '新建导出模板',
          editTitle: '编辑导出模板',
          detailTitle: '导出模板详情',
          hint: '该模板在 [业务操作-业务管理-导出] 时调用！',
          downloadToast: '模板下载功能待后端接入',
          downloadFieldsToast: '字段模板下载功能待后端接入'
        },
        waybillRule: '运单号规则',
        notificationConfig: '通知配置',
        initData: '初始化数据',
        stationScan: '站点扫描配置',
        fieldMapping: '字段映射'
      }
    },
    dataManage: {
      common: {
        createTime: '创建时间',
        keywordPlaceholder: '请输入名称或编码'
      },
      basic: {
        title: '基础资料',
        customer: {
          title: '客户',
          code: '客户编码',
          name: '客户名称',
          contact: '联系人',
          phone: '联系电话',
          address: '地址',
          form: { codePlaceholder: '请输入客户编码', namePlaceholder: '请输入客户名称' }
        },
        supplier: {
          title: '供应商',
          code: '供应商编码',
          name: '供应商名称',
          contact: '对接人',
          phone: '联系电话',
          level: '等级',
          form: { codePlaceholder: '请输入供应商编码', namePlaceholder: '请输入供应商名称' }
        },
        goods: {
          title: '商品',
          code: '商品编码',
          name: '商品名称',
          spec: '规格',
          unit: '单位',
          categoryName: '分类',
          form: { codePlaceholder: '请输入商品编码', namePlaceholder: '请输入商品名称' }
        },
        category: {
          title: '商品分类',
          code: '分类编码',
          name: '分类名称',
          sort: '排序',
          form: { codePlaceholder: '请输入分类编码', namePlaceholder: '请输入分类名称' }
        }
      },
      finance: {
        title: '财务资料',
        account: {
          title: '结算账户',
          code: '账户编码',
          name: '账户名称',
          accountType: '账户类型',
          bank: '开户行',
          balance: '余额',
          form: { codePlaceholder: '请输入账户编码', namePlaceholder: '请输入账户名称' }
        },
        currency: {
          title: '币种',
          code: '币种代码',
          name: '币种名称',
          rate: '汇率',
          symbol: '符号',
          form: { codePlaceholder: '请输入币种代码', namePlaceholder: '请输入币种名称' }
        },
        tax: {
          title: '税率',
          name: '方案名称',
          rate: '税率',
          taxType: '税种',
          form: { namePlaceholder: '请输入方案名称' }
        },
        settlement: {
          title: '结算方式',
          name: '方式名称',
          period: '结算周期',
          form: { namePlaceholder: '请输入方式名称' }
        }
      },
      business: {
        title: '业务资料',
        warehouse: {
          title: '仓库',
          code: '仓库编码',
          name: '仓库名称',
          address: '地址',
          manager: '管理员',
          form: { codePlaceholder: '请输入仓库编码', namePlaceholder: '请输入仓库名称' }
        },
        location: {
          title: '库位',
          code: '库位编码',
          name: '库位名称',
          warehouseName: '所属仓库',
          capacity: '容量',
          form: { codePlaceholder: '请输入库位编码', namePlaceholder: '请输入库位名称' }
        },
        carrier: {
          title: '承运商',
          code: '承运商编码',
          name: '承运商名称',
          contact: '联系人',
          phone: '联系电话',
          form: { codePlaceholder: '请输入承运商编码', namePlaceholder: '请输入承运商名称' }
        },
        store: {
          title: '门店',
          code: '门店编码',
          name: '门店名称',
          address: '地址',
          owner: '负责人',
          form: { codePlaceholder: '请输入门店编码', namePlaceholder: '请输入门店名称' }
        }
      }
    },
    home: {
      branchDesc:
        '为了方便大家开发和更新合并，我们对main分支的代码进行了精简，只保留了首页菜单，其余内容已移至example分支进行维护。预览地址显示的内容即为example分支的内容。',
      greeting: '早安，{userName}, 今天又是充满活力的一天!',
      weatherDesc: '今日多云转晴，20℃ - 25℃!',
      projectCount: '项目数',
      todo: '待办',
      message: '消息',
      downloadCount: '下载量',
      registerCount: '注册量',
      schedule: '作息安排',
      study: '学习',
      work: '工作',
      rest: '休息',
      entertainment: '娱乐',
      visitCount: '访问量',
      turnover: '成交额',
      dealCount: '成交量',
      projectNews: {
        title: '项目动态',
        moreNews: '更多动态',
        desc1: 'Soybean 在2021年5月28日创建了开源项目 soybean-admin!',
        desc2: 'Yanbowe 向 soybean-admin 提交了一个bug，多标签栏不会自适应。',
        desc3: 'Soybean 准备为 soybean-admin 的发布做充分的准备工作!',
        desc4: 'Soybean 正在忙于为soybean-admin写项目说明文档！',
        desc5: 'Soybean 刚才把工作台页面随便写了一些，凑合能看了！'
      },
      creativity: '创意'
    }
  },
  form: {
    required: '不能为空',
    userName: {
      required: '请输入用户名',
      invalid: '用户名格式不正确'
    },
    phone: {
      required: '请输入手机号',
      invalid: '手机号格式不正确'
    },
    pwd: {
      required: '请输入密码',
      invalid: '密码格式不正确，3-18位字符，包含字母、数字、下划线'
    },
    confirmPwd: {
      required: '请输入确认密码',
      invalid: '两次输入密码不一致'
    },
    code: {
      required: '请输入验证码',
      invalid: '验证码格式不正确'
    },
    email: {
      required: '请输入邮箱',
      invalid: '邮箱格式不正确'
    }
  },
  dropdown: {
    closeCurrent: '关闭',
    closeOther: '关闭其它',
    closeLeft: '关闭左侧',
    closeRight: '关闭右侧',
    closeAll: '关闭所有',
    pin: '固定标签',
    unpin: '取消固定'
  },
  icon: {
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    lang: '切换语言',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    reload: '刷新页面',
    collapse: '折叠菜单',
    expand: '展开菜单',
    pin: '固定',
    unpin: '取消固定'
  },
  datatable: {
    itemCount: '共 {total} 条',
    fixed: {
      left: '左固定',
      right: '右固定',
      unFixed: '取消固定'
    }
  }
};

export default local;
