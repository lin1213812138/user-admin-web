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
    chooseFile: '选择文件',
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
    notSupported: '该属性暂不支持在面板编辑',
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
    save: '保存',
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
    'permission-manage': '权限管理',
    'permission-manage_user': '用户管理',
    'permission-manage_role': '角色管理',
    'permission-manage_menu': '菜单管理',
    'system-manage_site': '站点管理',
    'system-manage_group': '组别管理',
    'system-manage_customer': '客户管理',
    'data-manage': '资料管理',
    'data-manage_basic': '基础资料',
    'data-manage_finance': '财务资料',
    'data-manage_business': '业务资料',
    'system-manage_setting': '系统设置',
    'system-manage_print-design': '设计标签',
    'system-manage_label-designer': '标签设计',
    'channel-quote': '渠道报价',
    'channel-quote_receive': '收货渠道',
    'channel-quote_ship': '发货渠道'
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
        userName: '用户账号',
        nickName: '用户名称',
        roleName: '用户角色',
        password: '用户密码',
        siteName: '所属站点',
        groupName: '所属组别',
        status: '状态',
        basicInfo: '基本信息',
        profileInfo: '个人档案',
        realName: '姓名',
        contactPhone: '联系电话',
        position: '职位',
        gender: '性别',
        male: '男',
        female: '女',
        email: '邮箱',
        hireDate: '入职时间',
        birthday: '出生日期',
        wechat: '微信',
        attachment: '附件',
        homeAddress: '家庭住址',
        otherContact: '其他联系方式',
        remark: '备注',
        wechatQrcode: '微信二维码',
        createTime: '创建时间',
        form: {
          userNamePlaceholder: '请输入系统登录用户名',
          nickNamePlaceholder: '请输入',
          roleNamePlaceholder: '请输入',
          passwordPlaceholder: '请输入密码',
          siteNamePlaceholder: '请输入',
          groupNamePlaceholder: '请输入',
          statusPlaceholder: '请选择状态',
          realNamePlaceholder: '请输入',
          contactPhonePlaceholder: '请输入',
          positionPlaceholder: '请输入',
          genderPlaceholder: '请输入',
          emailPlaceholder: '请输入',
          hireDatePlaceholder: '请输入',
          birthdayPlaceholder: '请输入',
          wechatPlaceholder: '请输入',
          homeAddressPlaceholder: '请输入',
          otherContactPlaceholder: '请输入',
          remarkPlaceholder: '请输入'
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
        searchMenuPlaceholder: '搜索菜单名称 / 路由地址 / 权限标识',
        loadMenuFailed: '菜单权限加载失败',
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
      site: {
        siteCode: '站点编号',
        siteName: '站点名称',
        contactName: '联系人',
        contactPhone: '联系电话',
        workTime: '工作时间',
        defaultOrigin: '默认出发地',
        warehouseAddress: '仓库地址',
        remark: '站点备注',
        updateTime: '最后更新',
        status: '状态',
        createTime: '创建时间',
        form: {
          siteCodePlaceholder: '请输入站点编号',
          siteNamePlaceholder: '请输入站点名称',
          contactNamePlaceholder: '请输入联系人',
          contactPhonePlaceholder: '请输入联系电话',
          workTimePlaceholder: '如：周一至周六 9:00-20:00',
          defaultOriginPlaceholder: '请输入默认出发地',
          warehouseAddressPlaceholder: '请输入仓库地址',
          remarkPlaceholder: '请输入站点备注',
          statusPlaceholder: '请选择状态'
        }
      },
      group: {
        groupName: '组别名称',
        siteName: '所属站点',
        remark: '组别备注',
        createTime: '创建',
        updateTime: '最后更新',
        status: '状态',
        form: {
          groupNamePlaceholder: '请输入组别名称',
          siteNamePlaceholder: '请选择所属站点',
          remarkPlaceholder: '请输入组别备注',
          statusPlaceholder: '请选择状态'
        }
      },
      customer: {
        customerCode: '客户编号',
        customerName: '客户名称',
        customerLevel: '客户等级',
        customerSource: '客户来源',
        contactName: '联系人',
        contactPhone: '联系电话',
        email: '邮箱',
        address: '地址',
        status: '状态',
        remark: '备注',
        basicInfo: '基本信息',
        contactInfo: '联系信息',
        levelNormal: '普通',
        levelImportant: '重要',
        levelVip: 'VIP',
        sourceWebsite: '官网',
        sourceReferral: '转介绍',
        sourceAd: '广告',
        updateTime: '最后更新',
        form: {
          customerCodePlaceholder: '请输入客户编号',
          customerNamePlaceholder: '请输入客户名称',
          customerLevelPlaceholder: '请选择客户等级',
          customerSourcePlaceholder: '请选择客户来源',
          contactNamePlaceholder: '请输入联系人',
          contactPhonePlaceholder: '请输入联系电话',
          emailPlaceholder: '请输入邮箱',
          addressPlaceholder: '请输入地址',
          statusPlaceholder: '请选择状态',
          remarkPlaceholder: '请输入备注'
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
          copyTitle: '复制打印模板',
          design: '设计'
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
        traceCapture: {
          title: '轨迹抓取配置',
          subTab: {
            trackNetwork: '追踪网络',
            trackTransform: '轨迹改造',
            trackKeyword: '轨迹关键词',
            captureTime: '抓取时间',
            operationTrace: '操作轨迹'
          },
          col: {
            name: '名称',
            serverAddress: '服务器地址',
            systemType: '系统类型',
            lastEditor: '最后编辑',
            editTime: '编辑时间',
            node: '操作节点',
            timeFormat: '时间格式',
            location: '服务地点',
            description: '详细描述',
            published: '是否发布',
            statusName: '状态名称',
            keywordDefinition: '抓取轨迹关键词判断定义',
            ruleName: '规则名称',
            scope: '使用范围',
            keywordGroup: '关键词组',
            waybillStatus: '运单状态',
            enabled: '启用状态'
          },
          form: {
            name: '名称',
            namePlaceholder: '请输入名称',
            serverAddress: '服务器地址',
            serverAddressPlaceholder: '请输入服务器地址',
            systemType: '系统类型',
            systemTypePlaceholder: '请输入系统类型',
            node: '操作节点',
            nodePlaceholder: '请输入操作节点',
            timeFormat: '时间格式',
            timeFormatPlaceholder: '如 YYYY-MM-DD HH:mm',
            location: '服务地点',
            locationPlaceholder: '请输入服务地点',
            description: '详细描述',
            descriptionPlaceholder: '请输入详细描述',
            published: '是否发布',
            statusName: '状态名称',
            statusNamePlaceholder: '请输入状态名称',
            keywordDefinition: '抓取轨迹关键词判断定义',
            keywordDefinitionPlaceholder: '请输入关键词，多个关键词用中文逗号分隔',
            ruleName: '规则名称',
            ruleNamePlaceholder: '请输入规则名称',
            scope: '使用范围',
            keywordGroup: '关键词组',
            keywordGroupPlaceholder: '请输入关键词，多个关键词用中文逗号分隔',
            waybillStatus: '运单状态',
            enabled: '启用状态'
          },
          addRow: '新增',
          scopeOption: {
            global: '全局通用',
            site: '指定站点',
            customer: '指定客户'
          },
          waybillStatusOption: {
            inTransit: '转运中',
            delivered: '已送达',
            exception: '异常件',
            returned: '已退件'
          },
          timeFormatOption: {
            ymd: '年月日',
            ymdHm: '年-月-日 时分',
            ymdHms: '年-月-日 时分:秒'
          },
          createTitle: '新增',
          editTitle: '编辑'
        },
        initData: {
          title: '初始化数据',
          basicInfoTitle: '基本信息',
          basicInit: '基本信息初始化',
          businessInit: '业务数据初始化',
          channel: '渠道类别',
          network: '承运网络',
          bubble: '计泡规则',
          operation: '操作配置',
          cnName: '中文名称',
          enName: '英文名称',
          remark: '备注',
          cnNamePlaceholder: '请输入中文名称',
          enNamePlaceholder: '请输入英文名称',
          remarkPlaceholder: '请输入备注',
          addRow: '新增',
          info: {
            companyName: '公司名称',
            companyAddress: '公司地址',
            companyUrl: '公司网址',
            systemName: '系统名称',
            contactPhone: '联系电话',
            staffLogin: '员工登录',
            companyLogo: '公司LOGO',
            defaultOrigin: '默认出发地',
            customerLogin: '客户登录'
          }
        },
        fieldMapping: '字段映射',
        fieldMappingRequired: '必填'
      },
      printDesign: {
        title: '设计标签',
        back: '返回',
        paper: '纸张尺寸',
        zoomOut: '缩小',
        zoomIn: '放大',
        showGrid: '显示网格',
        hideGrid: '隐藏网格',
        showRuler: '显示刻度',
        hideRuler: '隐藏刻度',
        clear: '清空',
        clearConfirm: '确认清空',
        clearContent: '将删除画布上所有元素，确认继续？',
        save: '保存',
        preview: '预览',
        fields: '业务字段',
        basicElements: '基础元素',
        basicText: '文本',
        basicLongText: '长文本',
        basicImage: '图片',
        basicBarcode: '条形码',
        basicQrcode: '二维码',
        basicTable: '表格',
        basicHline: '横线',
        basicVline: '竖线',
        basicRect: '矩形',
        canvas: '设计画布',
        properties: '元素属性',
        print: '打印',
        loadFailed: '设计器加载失败',
        saveSuccess: '保存成功',
        noTemplate: '模板不存在',
        propertyEmpty: '未选中元素，请在画布中选择'
      },
      labelDesign: {
        title: '标签设计',
        basicElements: '基础元素',
        fields: '业务字段',
        basicText: '文本',
        basicLongText: '长文本',
        basicImage: '图片',
        basicBarcode: '条形码',
        basicQrcode: '二维码',
        basicRect: '矩形',
        basicHline: '横线',
        basicVline: '竖线',
        propX: 'X (pt)',
        propY: 'Y (pt)',
        propW: '宽 (pt)',
        propH: '高 (pt)',
        propText: '文本',
        propField: '绑定字段',
        propTestData: '测试数据',
        propFontSize: '字号',
        propColor: '颜色',
        propWeight: '字重',
        propAlignH: '水平对齐',
        propAlignV: '垂直对齐',
        propLineHeight: '行高',
        weightNormal: '正常',
        weightBold: '加粗',
        alignLeft: '左对齐',
        alignCenter: '居中对齐',
        alignRight: '右对齐',
        valignTop: '顶部对齐',
        valignMiddle: '居中对齐',
        valignBottom: '底部对齐',
        propSrc: '图片地址',
        propValue: '编码值',
        propSymbology: '条码类型',
        propDisplayValue: '显示文本',
        propTextGap: '编码值间距',
        propEcc: '纠错级别',
        propBorderWidth: '线宽',
        propBorderColor: '颜色',
        propBgColor: '背景色',
        propRadius: '圆角',
        dataPreview: '数据预览',
        sectionGeo: '位置与尺寸',
        sectionStyle: '样式',
        propTitleName: '标题名称',
        titleNameTip: '显示在内容上方的标题文字，可通过「关联标题」控制是否显示',
        propFieldType: '字段类型',
        propTitleFontSize: '标题字号',
        propTitleColor: '标题颜色',
        propTitleWeight: '标题字重',
        propShowBorder: '显示边框',
        propLinkTitle: '关联标题',
        propPlaceholder: '占位文本',
        placeholderInputTip: '输入预览数据',
        fieldTypeText: '文本',
        fieldTypeLongText: '长文本',
        fieldTypeBarcode: '条码',
        fieldTypeQrcode: '二维码',
        fieldTypeImage: '图片',
        fieldLabel: '字段',
        fieldUnbound: '未绑定',
        noSelection: '未选中元素',
        deleteElement: '删除元素',
        undo: '撤销',
        redo: '重做',
        grid: '显示网格',
        back: '返回',
        clear: '清空',
        clearConfirm: '确定要清空画布上的全部元素吗？',
        shortcut: '快捷键',
        shortcutWindows: 'Windows',
        shortcutMac: 'Mac',
        shortcutCopyPaste: '剪切/复制/粘贴',
        shortcutMove: '移动',
        shortcutQuickMove: '快速移动',
        shortcutNudge: '微调',
        shortcutDelete: '删除',
        shortcutArrows: '方向键',
        preview: '预览',
        print: '打印',
        resetZoom: '重置缩放',
        save: '保存',
        saveSuccess: '保存成功',
        saveFailed: '保存失败',
        loadFailed: '模板加载失败',
        selectTemplate: '选择模板'
      }
    },
    dataManage: {
      common: {
        createTime: '创建时间',
        keywordPlaceholder: '请输入名称或编码'
      },
      basic: {
        title: '基础资料',
        countryRegion: {
          title: '国家地区',
          code: '国家/地区编码',
          name: '国家/地区名称',
          phoneCode: '国际电话区号',
          form: { codePlaceholder: '请输入国家/地区编码', namePlaceholder: '请输入国家/地区名称' }
        },
        postalRoute: {
          title: '邮政路由码',
          code: '路由码',
          name: '路由名称',
          country: '所属国家',
          form: { codePlaceholder: '请输入路由码', namePlaceholder: '请输入路由名称' }
        },
        fbaWarehouse: {
          title: 'FBA仓库',
          code: '仓库代码',
          name: 'FBA仓库名称',
          country: '所属国家',
          address: '仓库地址',
          form: { codePlaceholder: '请输入仓库代码', namePlaceholder: '请输入FBA仓库名称' }
        },
        customerLevel: {
          title: '客户等级',
          code: '等级编码',
          name: '等级名称',
          discount: '折扣率',
          form: { codePlaceholder: '请输入等级编码', namePlaceholder: '请输入等级名称' }
        },
        customerSource: {
          title: '客户来源',
          code: '来源编码',
          name: '来源名称',
          form: { codePlaceholder: '请输入来源编码', namePlaceholder: '请输入来源名称' }
        }
      },
      finance: {
        title: '财务资料',
        account: {
          title: '银行账户',
          code: '账户编码',
          name: '账户名称',
          accountType: '账户类型',
          bank: '开户行',
          balance: '余额',
          form: { codePlaceholder: '请输入账户编码', namePlaceholder: '请输入账户名称' }
        },
        currency: {
          title: '结算币种及汇率',
          code: '币种代码',
          name: '币种名称',
          rate: '汇率',
          symbol: '符号',
          form: { codePlaceholder: '请输入币种代码', namePlaceholder: '请输入币种名称' }
        },
        expenseType: {
          title: '费用类型',
          code: '类型编码',
          name: '类型名称',
          form: { codePlaceholder: '请输入类型编码', namePlaceholder: '请输入类型名称' }
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
        code: '编码',
        name: '名称',
        form: { codePlaceholder: '请输入编码', namePlaceholder: '请输入名称' },
        waybill: { title: '单号资料管理' },
        address: { title: '地址簿管理' },
        declaredGoods: { title: '申报物品' },
        problemCategory: { title: '问题类别' },
        goodsCategory: { title: '物品类别' },
        customsType: { title: '报关类型' },
        exportReason: { title: '出口原因' },
        clearanceMethod: { title: '清关方式' },
        salesTerms: { title: '销售条款' }
      }
    },
    channelQuote: {
      common: {
        createTime: '创建时间',
        keywordPlaceholder: '请输入名称或编码'
      },
      receive: {
        title: '收货渠道',
        code: '渠道编码',
        name: '渠道名称',
        form: { codePlaceholder: '请输入渠道编码', namePlaceholder: '请输入渠道名称' }
      },
      ship: {
        title: '发货渠道',
        code: '渠道编码',
        name: '渠道名称',
        form: { codePlaceholder: '请输入渠道编码', namePlaceholder: '请输入渠道名称' }
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
