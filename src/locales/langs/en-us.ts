const local: App.I18n.Schema = {
  system: {
    title: 'SoybeanAdmin',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateConfirm: 'Refresh immediately',
    updateCancel: 'Later'
  },
  common: {
    action: 'Action',
    expandFilter: 'Expand',
    collapseFilter: 'Collapse',
    add: 'Add',
    addSuccess: 'Add Success',
    saveSuccess: 'Save Success',
    backToHome: 'Back to home',
    batchDelete: 'Batch Delete',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    selectAll: 'Select All',
    unselectAll: 'Unselect All',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    confirm: 'Confirm',
    drag: 'Drag',
    iconPicker: {
      placeholder: 'Select an icon',
      clear: 'Clear',
      search: 'Search icons',
      empty: 'No matching icons',
      all: 'All',
      iconify: 'Iconify'
    },
    show: 'Show',
    treeNodeColumnLocked: 'Tree-node column cannot be hidden',
    name: 'Name',
    fixed: 'Fixed',
    width: 'Width',
    minWidth: 'Min Width',
    sortable: 'Sortable',
    unFixed: 'Unfixed',
    fixedLeft: 'Fixed Left',
    fixedRight: 'Fixed Right',
    delete: 'Delete',
    deleteSuccess: 'Delete Success',
    confirmDelete: 'Are you sure you want to delete?',
    copy: 'Copy',
    chooseFile: 'Choose File',
    copySuccess: 'Copied successfully',
    copyFailed: 'Copy failed',
    createSuccess: 'Created successfully',
    detail: 'Detail',
    edit: 'Edit',
    enable: 'Enable',
    disable: 'Disable',
    warning: 'Warning',
    error: 'Error',
    index: 'Index',
    keywordSearch: 'Please enter keyword',
    keyword: 'Keyword',
    status: 'Status',
    remark: 'Remark',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    lookForward: 'Coming soon',
    notSupported: 'This property is not editable in the panel',
    modify: 'Modify',
    modifySuccess: 'Modify Success',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check whether the value is valid',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    updateSuccess: 'Update Success',
    userCenter: 'User Center',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    },
    devInProgress: 'In Progress',
    excelTemplate: 'Excel Template',
    export: 'Export',
    exportFields: 'Export Fields',
    exportSelectedCount: '{count} selected',
    exportSuccess: 'Export succeeded',
    exportFailed: 'Export failed',
    exportScope: 'Data Scope',
    exportScopeAll: 'All Data',
    exportScopePage: 'Current Page ({count})',
    exportScopeChecked: 'Selected Rows ({count})',
    exportScopeCheckedEmpty: 'Please select rows to export first',
    exportScopeAllUnavailable: 'Full data source not configured',
    addField: 'Add Field',
    customField: 'Custom Field',
    fieldName: 'Field Name',
    fieldNamePlaceholder: 'Please enter field name',
    dataField: 'Data Field',
    dataFieldPlaceholder: 'Please enter data field key',
    valueMode: 'Value Mode',
    valueModeField: 'From Data',
    valueModeFixed: 'Fixed Value',
    fixedValuePlaceholder: 'Please enter fixed value'
  },
  request: {
    logout: 'Logout user after request failed',
    logoutMsg: 'User status is invalid, please log in again',
    logoutWithModal: 'Pop up modal after request failed and then log out user',
    logoutWithModalMsg: 'User status is invalid, please log in again',
    refreshToken: 'The requested token has expired, refresh the token',
    tokenExpired: 'The requested token has expired'
  },
  theme: {
    themeDrawerTitle: 'Theme Configuration',
    tabs: {
      appearance: 'Appearance',
      layout: 'Layout',
      general: 'General',
      preset: 'Preset'
    },
    appearance: {
      themeSchema: {
        title: 'Theme Schema',
        light: 'Light',
        dark: 'Dark',
        auto: 'Follow System'
      },
      grayscale: 'Grayscale',
      colourWeakness: 'Colour Weakness',
      themeColor: {
        title: 'Theme Color',
        primary: 'Primary',
        info: 'Info',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        followPrimary: 'Follow Primary'
      },
      themeRadius: {
        title: 'Theme Radius'
      },
      recommendColor: 'Apply Recommended Color Algorithm',
      recommendColorDesc: 'The recommended color algorithm refers to',
      preset: {
        title: 'Theme Presets',
        apply: 'Apply',
        applySuccess: 'Preset applied successfully',
        default: {
          name: 'Default Preset',
          desc: 'Default theme preset with balanced settings'
        },
        dark: {
          name: 'Dark Preset',
          desc: 'Dark theme preset for night time usage'
        },
        compact: {
          name: 'Compact Preset',
          desc: 'Compact layout preset for small screens'
        },
        azir: {
          name: "Azir's Preset",
          desc: 'It is a cold and elegant preset that Azir likes'
        }
      }
    },
    layout: {
      layoutMode: {
        title: 'Layout Mode',
        vertical: 'Vertical Mode',
        horizontal: 'Horizontal Mode',
        'vertical-mix': 'Vertical Mix Mode',
        'vertical-hybrid-header-first': 'Left Hybrid Header-First',
        'top-hybrid-sidebar-first': 'Top-Hybrid Sidebar-First',
        'top-hybrid-header-first': 'Top-Hybrid Header-First',
        vertical_detail: 'Vertical menu layout, with the menu on the left and content on the right.',
        'vertical-mix_detail':
          'Vertical mix-menu layout, with the primary menu on the dark left side and the secondary menu on the lighter left side.',
        'vertical-hybrid-header-first_detail':
          'Left hybrid layout, with the primary menu at the top, the secondary menu on the dark left side, and the tertiary menu on the lighter left side.',
        horizontal_detail: 'Horizontal menu layout, with the menu at the top and content below.',
        'top-hybrid-sidebar-first_detail':
          'Top hybrid layout, with the primary menu on the left and the secondary menu at the top.',
        'top-hybrid-header-first_detail':
          'Top hybrid layout, with the primary menu at the top and the secondary menu on the left.'
      },
      tab: {
        title: 'Tab Settings',
        visible: 'Tab Visible',
        cache: 'Tag Bar Info Cache',
        cacheTip: 'Keep the tab bar information after leaving the page',
        height: 'Tab Height',
        mode: {
          title: 'Tab Mode',
          slider: 'Slider',
          chrome: 'Chrome',
          button: 'Button'
        },
        closeByMiddleClick: 'Close Tab by Middle Click',
        closeByMiddleClickTip: 'Enable closing tabs by clicking with the middle mouse button'
      },
      header: {
        title: 'Header Settings',
        height: 'Header Height',
        breadcrumb: {
          visible: 'Breadcrumb Visible',
          showIcon: 'Breadcrumb Icon Visible'
        }
      },
      sider: {
        title: 'Sider Settings',
        inverted: 'Dark Sider',
        width: 'Sider Width',
        collapsedWidth: 'Sider Collapsed Width',
        mixWidth: 'Mix Sider Width',
        mixCollapsedWidth: 'Mix Sider Collapse Width',
        mixChildMenuWidth: 'Mix Child Menu Width',
        autoSelectFirstMenu: 'Auto Select First Submenu',
        autoSelectFirstMenuTip:
          'When a first-level menu is clicked, the first submenu is automatically selected and navigated to the deepest level',
        accordion: 'Sidebar Accordion'
      },
      footer: {
        title: 'Footer Settings',
        visible: 'Footer Visible',
        fixed: 'Fixed Footer',
        height: 'Footer Height',
        right: 'Right Footer'
      },
      content: {
        title: 'Content Area Settings',
        scrollMode: {
          title: 'Scroll Mode',
          tip: 'The theme scroll only scrolls the main part, the outer scroll can carry the header and footer together',
          wrapper: 'Wrapper',
          content: 'Content'
        },
        page: {
          animate: 'Page Animate',
          mode: {
            title: 'Page Animate Mode',
            fade: 'Fade',
            'fade-slide': 'Slide',
            'fade-bottom': 'Fade Zoom',
            'fade-scale': 'Fade Scale',
            'zoom-fade': 'Zoom Fade',
            'zoom-out': 'Zoom Out',
            none: 'None'
          }
        },
        fixedHeaderAndTab: 'Fixed Header And Tab'
      }
    },
    general: {
      title: 'General Settings',
      watermark: {
        title: 'Watermark Settings',
        visible: 'Watermark Full Screen Visible',
        text: 'Custom Watermark Text',
        enableUserName: 'Enable User Name Watermark',
        enableTime: 'Show Current Time',
        timeFormat: 'Time Format'
      },
      multilingual: {
        title: 'Multilingual Settings',
        visible: 'Display multilingual button'
      },
      globalSearch: {
        title: 'Global Search Settings',
        visible: 'Display GlobalSearch button'
      }
    },
    configOperation: {
      copyConfig: 'Copy Config',
      copySuccessMsg: 'Copy Success, Please replace the variable "themeSettings" in "src/theme/settings.ts"',
      resetConfig: 'Reset Config',
      resetSuccessMsg: 'Reset Success'
    }
  },
  route: {
    login: 'Login',
    403: 'No Permission',
    404: 'Page Not Found',
    500: 'Server Error',
    'iframe-page': 'Iframe',
    home: 'Home',
    'system-manage': 'System Management',
    'permission-manage': 'Permission Management',
    'permission-manage_user': 'User Management',
    'permission-manage_role': 'Role Management',
    'permission-manage_menu': 'Menu Management',
    'system-manage_site': 'Site Management',
    'system-manage_group': 'Group Management',
    'system-manage_customer': 'Customer Management',
    'data-manage': 'Data Manage',
    'data-manage_basic': 'Basic',
    'data-manage_finance': 'Finance',
    'data-manage_business': 'Business',
    'system-manage_setting': 'System Settings',
    'system-manage_print-design': 'Design Label',
    'system-manage_label-designer': 'Label Designer'
  },
  page: {
    login: {
      common: {
        loginOrRegister: 'Login / Register',
        userNamePlaceholder: 'Please enter user name',
        phonePlaceholder: 'Please enter phone number',
        codePlaceholder: 'Please enter verification code',
        passwordPlaceholder: 'Please enter password',
        confirmPasswordPlaceholder: 'Please enter password again',
        codeLogin: 'Verification code login',
        confirm: 'Confirm',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {userName} !'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember me',
        forgetPassword: 'Forget password?',
        register: 'Register',
        otherAccountLogin: 'Other Account Login',
        otherLoginMode: 'Other Login Mode',
        superAdmin: 'Super Admin',
        admin: 'Admin',
        user: 'User'
      },
      codeLogin: {
        title: 'Verification Code Login',
        getCode: 'Get verification code',
        reGetCode: 'Reacquire after {time}s',
        sendCodeSuccess: 'Verification code sent successfully',
        imageCodePlaceholder: 'Please enter image verification code'
      },
      register: {
        title: 'Register',
        agreement: 'I have read and agree to',
        protocol: '《User Agreement》',
        policy: '《Privacy Policy》'
      },
      resetPwd: {
        title: 'Reset Password'
      },
      bindWeChat: {
        title: 'Bind WeChat'
      }
    },
    manage: {
      user: {
        userName: 'User Account',
        nickName: 'User Name',
        roleName: 'User Role',
        password: 'Password',
        siteName: 'Site',
        groupName: 'Group',
        status: 'Status',
        basicInfo: 'Basic Information',
        profileInfo: 'Personal Profile',
        realName: 'Full Name',
        contactPhone: 'Contact Phone',
        position: 'Position',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        email: 'Email',
        hireDate: 'Hire Date',
        birthday: 'Birthday',
        wechat: 'WeChat',
        attachment: 'Attachment',
        homeAddress: 'Home Address',
        otherContact: 'Other Contact',
        remark: 'Remark',
        wechatQrcode: 'WeChat QR Code',
        createTime: 'Create Time',
        form: {
          userNamePlaceholder: 'Please enter login account',
          nickNamePlaceholder: 'Please enter',
          roleNamePlaceholder: 'Please select',
          passwordPlaceholder: 'Please enter password',
          siteNamePlaceholder: 'Please select',
          groupNamePlaceholder: 'Please select',
          statusPlaceholder: 'Please select status',
          realNamePlaceholder: 'Please enter',
          contactPhonePlaceholder: 'Please enter',
          positionPlaceholder: 'Please enter',
          genderPlaceholder: 'Please select',
          emailPlaceholder: 'Please enter',
          hireDatePlaceholder: 'Please select',
          birthdayPlaceholder: 'Please select',
          wechatPlaceholder: 'Please enter',
          homeAddressPlaceholder: 'Please enter',
          otherContactPlaceholder: 'Please enter',
          remarkPlaceholder: 'Please enter'
        }
      },
      role: {
        roleName: 'Role Name',
        roleCode: 'Role Code',
        remark: 'Description',
        sort: 'Sort',
        status: 'Status',
        createTime: 'Create Time',
        permission: 'Assign Permission',
        permissionTip: 'Check the menus that the role can access',
        searchMenuPlaceholder: 'Search menu name / route / permission',
        loadMenuFailed: 'Failed to load menu permissions',
        form: {
          roleNamePlaceholder: 'Please enter role name',
          roleCodePlaceholder: 'Please enter role code',
          sortPlaceholder: 'Please enter sort value',
          statusPlaceholder: 'Please select status',
          remarkPlaceholder: 'Please enter role description'
        }
      },
      menu: {
        parentMenu: 'Parent Menu',
        topMenu: 'Top Menu',
        type: 'Menu Type',
        catalog: 'Catalog',
        menu: 'Menu',
        menuName: 'Menu Name',
        icon: 'Menu Icon',
        routePath: 'Route Path',
        componentPath: 'Component Path',
        permission: 'Permission Code',
        sort: 'Sort',
        status: 'Status',
        visible: 'Visible',
        keepAlive: 'Keep Alive',
        isExternal: 'External Link',
        redirect: 'Redirect',
        createTime: 'Create Time',
        addMenu: 'Add Menu',
        editMenu: 'Edit Menu',
        addSubMenu: 'Add Submenu',
        form: {
          menuNamePlaceholder: 'Please enter menu name',
          iconPlaceholder: 'Please enter icon name, e.g. mdi:home',
          routePlaceholder: 'Please enter route path, e.g. /system/menu',
          componentPlaceholder: 'Please enter component path, e.g. views/system-manage/menu/index.vue',
          permissionPlaceholder: 'Please enter permission code, e.g. system:menu:list',
          redirectPlaceholder: 'Please enter redirect path'
        }
      },
      site: {
        siteCode: 'Site Code',
        siteName: 'Site Name',
        contactName: 'Contact',
        contactPhone: 'Phone',
        workTime: 'Working Hours',
        defaultOrigin: 'Default Origin',
        warehouseAddress: 'Warehouse Address',
        remark: 'Site Remark',
        updateTime: 'Last Updated',
        status: 'Status',
        createTime: 'Create Time',
        form: {
          siteCodePlaceholder: 'Please enter site code',
          siteNamePlaceholder: 'Please enter site name',
          contactNamePlaceholder: 'Please enter contact',
          contactPhonePlaceholder: 'Please enter phone',
          workTimePlaceholder: 'e.g. Mon-Sat 9:00-20:00',
          defaultOriginPlaceholder: 'Please enter default origin',
          warehouseAddressPlaceholder: 'Please enter warehouse address',
          remarkPlaceholder: 'Please enter site remark',
          statusPlaceholder: 'Please select status'
        }
      },
      group: {
        groupName: 'Group Name',
        siteName: 'Site',
        remark: 'Group Remark',
        createTime: 'Created',
        updateTime: 'Last Updated',
        status: 'Status',
        form: {
          groupNamePlaceholder: 'Please enter group name',
          siteNamePlaceholder: 'Please select site',
          remarkPlaceholder: 'Please enter group remark',
          statusPlaceholder: 'Please select status'
        }
      },
      customer: {
        customerCode: 'Customer Code',
        customerName: 'Customer Name',
        customerLevel: 'Level',
        customerSource: 'Source',
        contactName: 'Contact',
        contactPhone: 'Phone',
        email: 'Email',
        address: 'Address',
        status: 'Status',
        remark: 'Remark',
        basicInfo: 'Basic Info',
        contactInfo: 'Contact Info',
        levelNormal: 'Normal',
        levelImportant: 'Important',
        levelVip: 'VIP',
        sourceWebsite: 'Website',
        sourceReferral: 'Referral',
        sourceAd: 'Ad',
        updateTime: 'Last Updated',
        form: {
          customerCodePlaceholder: 'Please enter customer code',
          customerNamePlaceholder: 'Please enter customer name',
          customerLevelPlaceholder: 'Select level',
          customerSourcePlaceholder: 'Select source',
          contactNamePlaceholder: 'Please enter contact',
          contactPhonePlaceholder: 'Please enter phone',
          emailPlaceholder: 'Please enter email',
          addressPlaceholder: 'Please enter address',
          statusPlaceholder: 'Please select status',
          remarkPlaceholder: 'Please enter remark'
        }
      },
      setting: {
        inputFormat: 'Input Format',
        printFormat: {
          title: 'Print Format',
          listTitle: 'Print Format Type',
          name: 'Template Name',
          labelSize: 'Label Size',
          isDefault: 'Default',
          yes: 'Yes',
          no: 'No',
          generatedCount: 'Generated Labels',
          remark: 'Remark',
          lastEditor: 'Last Editor',
          editTime: 'Edit Time',
          create: 'Create',
          delete: 'Delete',
          view: 'View',
          copy: 'Copy',
          setDefault: 'Set Default',
          newTitle: 'New Print Template',
          detailTitle: 'Print Template Detail',
          copyTitle: 'Copy Print Template',
          design: 'Design'
        },
        exportFormat: {
          title: 'Export Format',
          listTitle: 'Export Format Type',
          name: 'Template Name',
          scope: 'Scope',
          scopeInternal: 'Internal System',
          scopeCustomer: 'Customer',
          scopeAll: 'All',
          fileName: 'Template File',
          remark: 'Remark',
          lastEditor: 'Last Editor',
          editTime: 'Edit Time',
          create: 'Create',
          delete: 'Delete',
          edit: 'Edit',
          download: 'Download Template',
          downloadFields: 'Download Field Template',
          newTitle: 'New Export Template',
          editTitle: 'Edit Export Template',
          detailTitle: 'Export Template Detail',
          hint: 'This template is called at [Business Operation - Business Management - Export]!',
          downloadToast: 'Template download pending backend integration',
          downloadFieldsToast: 'Field template download pending backend integration'
        },
        waybillRule: 'Waybill Rule',
        notificationConfig: 'Notification Config',
        initData: 'Init Data',
        stationScan: 'Station Scan Config',
        fieldMapping: 'Field Mapping',
        fieldMappingRequired: 'Required'
      },
      printDesign: {
        title: 'Design Label',
        back: 'Back',
        paper: 'Paper Size',
        zoomOut: 'Zoom Out',
        zoomIn: 'Zoom In',
        showGrid: 'Show Grid',
        hideGrid: 'Hide Grid',
        showRuler: 'Show Ruler',
        hideRuler: 'Hide Ruler',
        clear: 'Clear',
        clearConfirm: 'Confirm Clear',
        clearContent: 'All elements on the canvas will be removed. Continue?',
        save: 'Save',
        preview: 'Preview',
        fields: 'Business Fields',
        basicElements: 'Basic Elements',
        basicText: 'Text',
        basicLongText: 'Long Text',
        basicImage: 'Image',
        basicBarcode: 'Barcode',
        basicQrcode: 'QR Code',
        basicTable: 'Table',
        basicHline: 'H Line',
        basicVline: 'V Line',
        basicRect: 'Rect',
        canvas: 'Canvas',
        properties: 'Properties',
        print: 'Print',
        loadFailed: 'Failed to load designer',
        saveSuccess: 'Saved successfully',
        noTemplate: 'Template not found',
        propertyEmpty: 'No element selected, please select one on the canvas'
      },
      labelDesign: {
        title: 'Label Designer',
        basicElements: 'Basic Elements',
        fields: 'Business Fields',
        basicText: 'Text',
        basicLongText: 'Long Text',
        basicImage: 'Image',
        basicBarcode: 'Barcode',
        basicQrcode: 'QR Code',
        basicRect: 'Rect',
        basicHline: 'H Line',
        basicVline: 'V Line',
        propX: 'X (pt)',
        propY: 'Y (pt)',
        propW: 'Width (pt)',
        propH: 'Height (pt)',
        propText: 'Text',
        propField: 'Bind Field',
        propTestData: 'Test Data',
        propFontSize: 'Font Size',
        propColor: 'Color',
        propWeight: 'Weight',
        propAlignH: 'Horizontal Align',
        propAlignV: 'Vertical Align',
        propLineHeight: 'Line Height',
        weightNormal: 'Normal',
        weightBold: 'Bold',
        alignLeft: 'Left',
        alignCenter: 'Center',
        alignRight: 'Right',
        valignTop: 'Top',
        valignMiddle: 'Middle',
        valignBottom: 'Bottom',
        propSrc: 'Image URL',
        propValue: 'Value',
        propSymbology: 'Symbology',
        propDisplayValue: 'Show Text',
        propTextGap: 'Text Gap',
        propEcc: 'ECC Level',
        propBorderWidth: 'Line Width',
        propBorderColor: 'Color',
        propBgColor: 'Background',
        propRadius: 'Radius',
        dataPreview: 'Data Preview',
        sectionGeo: 'Position & Size',
        sectionStyle: 'Style',
        propTitleName: 'Title Name',
        titleNameTip: 'Title shown above the content; toggle it via "Show Title"',
        propFieldType: 'Field Type',
        propTitleFontSize: 'Title Font Size',
        propTitleColor: 'Title Color',
        propTitleWeight: 'Title Weight',
        propShowBorder: 'Show Border',
        propLinkTitle: 'Show Title',
        propPlaceholder: 'Placeholder',
        placeholderInputTip: 'Enter preview data',
        fieldTypeText: 'Text',
        fieldTypeLongText: 'Long Text',
        fieldTypeBarcode: 'Barcode',
        fieldTypeQrcode: 'QR Code',
        fieldTypeImage: 'Image',
        fieldLabel: 'Field',
        fieldUnbound: 'Unbound',
        noSelection: 'No element selected',
        deleteElement: 'Delete Element',
        undo: 'Undo',
        redo: 'Redo',
        grid: 'Show Grid',
        back: 'Back',
        clear: 'Clear',
        clearConfirm: 'Remove all elements from the canvas?',
        shortcut: 'Shortcuts',
        shortcutWindows: 'Windows',
        shortcutMac: 'Mac',
        shortcutCopyPaste: 'Cut/Copy/Paste',
        shortcutMove: 'Move',
        shortcutQuickMove: 'Quick Move',
        shortcutNudge: 'Nudge',
        shortcutDelete: 'Delete',
        shortcutArrows: 'Arrow Keys',
        preview: 'Preview',
        print: 'Print',
        resetZoom: 'Reset Zoom',
        save: 'Save',
        saveSuccess: 'Saved successfully',
        saveFailed: 'Failed to save',
        loadFailed: 'Failed to load template',
        selectTemplate: 'Select Template'
      }
    },
    dataManage: {
      common: {
        createTime: 'Created Time',
        keywordPlaceholder: 'Please enter name or code'
      },
      basic: {
        title: 'Basic',
        countryRegion: {
          title: 'Country / Region',
          code: 'Country/Region Code',
          name: 'Country/Region Name',
          phoneCode: 'Phone Code',
          form: { codePlaceholder: 'Enter country/region code', namePlaceholder: 'Enter country/region name' }
        },
        postalRoute: {
          title: 'Postal Route Code',
          code: 'Route Code',
          name: 'Route Name',
          country: 'Country',
          form: { codePlaceholder: 'Enter route code', namePlaceholder: 'Enter route name' }
        },
        fbaWarehouse: {
          title: 'FBA Warehouse',
          code: 'Warehouse Code',
          name: 'FBA Warehouse Name',
          country: 'Country',
          address: 'Address',
          form: { codePlaceholder: 'Enter warehouse code', namePlaceholder: 'Enter FBA warehouse name' }
        },
        customerLevel: {
          title: 'Customer Level',
          code: 'Level Code',
          name: 'Level Name',
          discount: 'Discount',
          form: { codePlaceholder: 'Enter level code', namePlaceholder: 'Enter level name' }
        },
        customerSource: {
          title: 'Customer Source',
          code: 'Source Code',
          name: 'Source Name',
          form: { codePlaceholder: 'Enter source code', namePlaceholder: 'Enter source name' }
        }
      },
      finance: {
        title: 'Finance',
        account: {
          title: 'Bank Account',
          code: 'Account Code',
          name: 'Account Name',
          accountType: 'Account Type',
          bank: 'Bank',
          balance: 'Balance',
          form: { codePlaceholder: 'Enter account code', namePlaceholder: 'Enter account name' }
        },
        currency: {
          title: 'Currency & Rate',
          code: 'Currency Code',
          name: 'Currency Name',
          rate: 'Rate',
          symbol: 'Symbol',
          form: { codePlaceholder: 'Enter currency code', namePlaceholder: 'Enter currency name' }
        },
        expenseType: {
          title: 'Expense Type',
          code: 'Type Code',
          name: 'Type Name',
          form: { codePlaceholder: 'Enter type code', namePlaceholder: 'Enter type name' }
        },
        settlement: {
          title: 'Settlement',
          name: 'Method Name',
          period: 'Period',
          form: { namePlaceholder: 'Enter method name' }
        }
      },
      business: {
        title: 'Business',
        code: 'Code',
        name: 'Name',
        form: { codePlaceholder: 'Enter code', namePlaceholder: 'Enter name' },
        waybill: { title: 'Waybill Data' },
        address: { title: 'Address Book' },
        declaredGoods: { title: 'Declared Goods' },
        problemCategory: { title: 'Problem Category' },
        goodsCategory: { title: 'Goods Category' },
        customsType: { title: 'Customs Type' },
        exportReason: { title: 'Export Reason' },
        clearanceMethod: { title: 'Clearance Method' },
        salesTerms: { title: 'Sales Terms' }
      }
    },
    home: {
      branchDesc:
        'For the convenience of everyone in developing and updating the merge, we have streamlined the code of the main branch, only retaining the homepage menu, and the rest of the content has been moved to the example branch for maintenance. The preview address displays the content of the example branch.',
      greeting: 'Good morning, {userName}, today is another day full of vitality!',
      weatherDesc: 'Today is cloudy to clear, 20℃ - 25℃!',
      projectCount: 'Project Count',
      todo: 'Todo',
      message: 'Message',
      downloadCount: 'Download Count',
      registerCount: 'Register Count',
      schedule: 'Work and rest Schedule',
      study: 'Study',
      work: 'Work',
      rest: 'Rest',
      entertainment: 'Entertainment',
      visitCount: 'Visit Count',
      turnover: 'Turnover',
      dealCount: 'Deal Count',
      projectNews: {
        title: 'Project News',
        moreNews: 'More News',
        desc1: 'Soybean created the open source project soybean-admin on May 28, 2021!',
        desc2: 'Yanbowe submitted a bug to soybean-admin, the multi-tab bar will not adapt.',
        desc3: 'Soybean is ready to do sufficient preparation for the release of soybean-admin!',
        desc4: 'Soybean is busy writing project documentation for soybean-admin!',
        desc5: 'Soybean just wrote some of the workbench pages casually, and it was enough to see!'
      },
      creativity: 'Creativity'
    }
  },
  form: {
    required: 'Cannot be empty',
    userName: {
      required: 'Please enter user name',
      invalid: 'User name format is incorrect'
    },
    phone: {
      required: 'Please enter phone number',
      invalid: 'Phone number format is incorrect'
    },
    pwd: {
      required: 'Please enter password',
      invalid: '3-18 characters, including letters, numbers, and underscores'
    },
    confirmPwd: {
      required: 'Please enter password again',
      invalid: 'The two passwords are inconsistent'
    },
    code: {
      required: 'Please enter verification code',
      invalid: 'Verification code format is incorrect'
    },
    email: {
      required: 'Please enter email',
      invalid: 'Email format is incorrect'
    }
  },
  dropdown: {
    closeCurrent: 'Close Current',
    closeOther: 'Close Other',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All',
    pin: 'Pin Tab',
    unpin: 'Unpin Tab'
  },
  icon: {
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload Page',
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    pin: 'Pin',
    unpin: 'Unpin'
  },
  datatable: {
    itemCount: 'Total {total} items',
    fixed: {
      left: 'Left Fixed',
      right: 'Right Fixed',
      unFixed: 'Unfixed'
    }
  }
};

export default local;
