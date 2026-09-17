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
    submitModify: 'Submit Changes',
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
    login: 'Login',
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
    upload: {
      exceedSize: 'File size cannot exceed {size}MB',
      draggerText: 'Click or drag files to this area to upload'
    },
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
    save: 'Save',
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
    'system-manage_site': 'Site Management',
    'system-manage_group': 'Group Management',
    'system-manage_user': 'User Management',
    'system-manage_role': 'Role Management',
    'system-manage_log': 'System Logs',
    'customer-manage': 'Customer Management',
    'customer-manage_customer': 'Customer List',
    'data-manage': 'Data Manage',
    'data-manage_basic': 'General',
    'data-manage_finance': 'Finance',
    'data-manage_business': 'Waybill',
    'data-manage_no-rule': 'Number Data',
    'data-manage_ship': 'Shipping Data',
    'data-manage_bl': 'Bill of Lading',
    'system-manage_setting': 'System Settings',
    'system-manage_print-design': 'Design Label',
    'system-manage_label-designer': 'Label Designer',
    'channel-quote': 'Channel Quote',
    'channel-quote_receive': 'Receive Channel',
    'channel-quote_ship': 'Ship Channel',
    'personal-center': 'Personal Center'
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
        confirm: 'Login',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {userName} !',
        title: 'TMS User Login'
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
        keyword: 'Keyword',
        idCard: 'ID Card',
        unknown: 'Unknown',
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
        relationCustomer: 'Related Customers',
        editPage: {
          creator: 'Created',
          update: 'Last Updated',
          tabPerm: 'Permissions',
          tabAccount: 'Account Config'
        },
        form: {
          userNamePlaceholder: 'Please enter account',
          nickNamePlaceholder: 'Please enter user name',
          roleNamePlaceholder: 'Please select roles',
          passwordPlaceholder: 'Please enter password',
          passwordEditPlaceholder: 'Leave blank to keep current password',
          siteNamePlaceholder: 'Please select site',
          groupNamePlaceholder: 'Please select groups',
          statusPlaceholder: 'Please select status',
          keywordPlaceholder: 'Search by account / user name / full name',
          idCardPlaceholder: 'Please enter ID card number',
          realNamePlaceholder: 'Please enter',
          contactPhonePlaceholder: 'Please enter',
          positionPlaceholder: 'Please enter',
          genderPlaceholder: 'Please select',
          emailPlaceholder: 'Please enter',
          hireDatePlaceholder: 'Please select date',
          birthdayPlaceholder: 'Please select date',
          wechatPlaceholder: 'Please enter',
          homeAddressPlaceholder: 'Please enter',
          otherContactPlaceholder: 'Please enter',
          remarkPlaceholder: 'Please enter'
        }
      },
      role: {
        roleName: 'Role Name',
        roleType: 'Role Type',
        desc: 'Description',
        refId: 'Inherit Permissions',
        dataAuths: 'Data Permissions',
        order: 'Sort',
        creator: 'Creator',
        createTime: 'Create Time',
        updateBy: 'Editor',
        updateTime: 'Update Time',
        roleTypes: {
          service: 'Service',
          sales: 'Sales',
          operation: 'Operation',
          finance: 'Finance',
          manager: 'Manager',
          admin: 'Admin'
        },
        dataAuthOptions: {
          user: 'Only own customers',
          group: 'Only own group customers'
        },
        ctrls: {
          sendOrder: 'Allow editing after outbound',
          sendCtrl: 'Weighing required for outbound',
          orderCol: 'Allow configuring waybill columns',
          editInfo: 'Allow editing personal info'
        },
        permission: 'Assign Permission',
        relationUser: 'Related Users',
        permissionTip: 'Check the menus that the role can access',
        permissionDisabledTip: 'Super admin roles cannot be assigned permissions',
        builtIn: 'Built-in',
        builtInEditTip: 'Built-in roles cannot be modified',
        builtInDeleteTip: 'Built-in roles cannot be deleted',
        builtInBatchDeleteTip: 'Selection contains built-in roles, which have been skipped',
        searchMenuPlaceholder: 'Search menu name / route / permission',
        loadMenuFailed: 'Failed to load menu permissions',
        form: {
          roleNamePlaceholder: 'Please enter role name',
          roleTypePlaceholder: 'Please select role type',
          refIdPlaceholder: 'Please select a role to inherit permissions from',
          orderPlaceholder: 'Please enter sort value',
          descPlaceholder: 'Please enter role description'
        }
      },
      site: {
        code: 'Site Code',
        name: 'Site Name',
        concat: 'Contact',
        phone: 'Phone',
        workTime: 'Working Hours',
        startPlace: 'Default Origin',
        address: 'Warehouse Address',
        note: 'Site Remark',
        siteType: 'Site Type',
        siteTypeBranch: 'Branch',
        siteTypeHeadquarters: 'Headquarters',
        updateDate: 'Last Updated',
        keyword: 'Keyword',
        relationUser: 'Related Users',
        relationCustomer: 'Related Customers',
        view: 'View',
        customerCode: 'Customer Code',
        customerName: 'Customer Name',
        siteName: 'Site',
        form: {
          codePlaceholder: 'Please enter site code',
          namePlaceholder: 'Please enter site name',
          concatPlaceholder: 'Please enter contact',
          phonePlaceholder: 'Please enter phone',
          workTimePlaceholder: 'e.g. Mon-Sat 9:00-20:00',
          startPlacePlaceholder: 'Please enter default origin',
          addressPlaceholder: 'Please enter warehouse address',
          notePlaceholder: 'Please enter site remark',
          siteTypePlaceholder: 'Please select site type',
          keywordPlaceholder: 'Please enter code/name keyword'
        }
      },
      opLog: {
        opName: 'Operation',
        creator: 'Operator',
        client: 'Client',
        opType: 'Type',
        refNames: 'Related Entities',
        ip: 'IP Address',
        desc: 'Summary',
        createDate: 'Operation Time',
        detail: 'Log Details',
        logTitle: 'Change Details',
        noDetail: 'No change details',
        clientOption: {
          tms: 'TMS',
          pc: 'PC',
          pda: 'PDA',
          oms: 'OMS'
        },
        opTypeOption: {
          login: 'Login',
          update: 'Update',
          del: 'Delete',
          logout: 'Logout',
          trace: 'Trace'
        },
        form: {
          dateRange: 'Operation Time',
          opType: 'Operation Type',
          client: 'Client',
          keyword: 'Keyword',
          keywordPlaceholder: 'Please enter related entity name',
          opTypePlaceholder: 'Please select operation type',
          clientPlaceholder: 'Please select client'
        },
        log: {
          name: 'Field',
          oldValue: 'Old Value',
          newValue: 'New Value',
          desc: 'Description'
        }
      },
      group: {
        groupName: 'Group Name',
        siteName: 'Site',
        relationUser: 'Related Users',
        relationCustomer: 'Related Customers',
        remark: 'Group Remark',
        creator: 'Creator',
        createTime: 'Created',
        updateBy: 'Editor',
        updateTime: 'Last Updated',
        form: {
          groupNamePlaceholder: 'Please enter group name',
          siteNamePlaceholder: 'Please select site',
          remarkPlaceholder: 'Please enter group remark'
        }
      },
      customer: {
        keyword: 'Keyword',
        customerCode: 'Customer Code',
        customerName: 'Customer Name',
        account: 'Account',
        customerLevel: 'Level',
        customerSource: 'Source',
        contactName: 'Contact',
        contactPhone: 'Phone',
        email: 'Email',
        address: 'Address',
        wx: 'WeChat',
        qq: 'QQ',
        tag: 'Tag',
        taxInfo: 'Tax Info',
        status: 'Status',
        remark: 'Remark',
        basicInfo: 'Basic Info',
        settlementInfo: 'Settlement',
        handlerInfo: 'Agent',
        billMode: 'Billing Mode',
        withhold: 'Withhold',
        creditLimit: 'Credit Limit',
        contractRange: 'Contract Period',
        billGenMode: 'Bill Gen Mode',
        billGenStatus: 'Related Order Status',
        site: 'Site',
        group: 'Group',
        salesman: 'Salesman',
        service: 'Service',
        picker: 'Picker',
        cashier: 'Cashier',
        webStatus: 'Order Enabled',
        createDate: 'Created At',
        deleteDisabledTip: 'Delete is not available yet',
        form: {
          keywordPlaceholder: 'Code / Name / Account',
          codePlaceholder: 'Auto-generated if left blank',
          namePlaceholder: 'Please enter customer name',
          accountPlaceholder: 'Please enter account',
          contactPlaceholder: 'Please enter contact',
          mobilePlaceholder: 'Please enter phone',
          emailPlaceholder: 'Please enter email',
          addressPlaceholder: 'Please enter address',
          sourcePlaceholder: 'Select source',
          levelPlaceholder: 'Select level',
          statusPlaceholder: 'Please select status',
          billModePlaceholder: 'Select billing mode',
          withholdPlaceholder: 'Select withhold mode',
          creditLimitPlaceholder: 'Please enter credit limit',
          billGenModePlaceholder: 'Select bill gen mode',
          sitePlaceholder: 'Select site',
          groupPlaceholder: 'Select group',
          salesmanPlaceholder: 'Select salesman',
          servicePlaceholder: 'Select service',
          pickerPlaceholder: 'Select picker',
          cashierPlaceholder: 'Select cashier'
        },
        detail: {
          title: 'Customer Detail',
          addressBook: 'Address Book',
          fbaCode: 'FBA Code',
          customer: 'Customer',
          stCountry: 'Receiver Country',
          spCountry: 'Shipper Country',
          address2: 'Address 2',
          address3: 'Address 3',
          idCardFront: 'ID Card Front',
          idCardBack: 'ID Card Back',
          bizFinance: 'Business & Finance',
          shipTo: 'Ship To',
          shipper: 'Shipper',
          fileManage: 'Attachments',
          apiConfig: 'API Config',
          opLog: 'Operation Log',
          billPeriod: 'Bill Period',
          billDay: 'Bill Day',
          billPerson: 'Billing Contact',
          billGenStatus: 'Related Order Status',
          keyword: 'Keyword',
          search: 'Search by file name',
          addressSearchPlaceholder: 'Search by name / phone / zip',
          addressTag: 'Tag',
          destination: 'Destination',
          stName: 'Receiver',
          spName: 'Shipper',
          stCompany: 'Receiver Company',
          spCompany: 'Shipper Company',
          stPhone: 'Receiver Phone',
          spPhone: 'Shipper Phone',
          stEmail: 'Receiver Email',
          spEmail: 'Shipper Email',
          stAddress: 'Receiver Address',
          spAddress: 'Shipper Address',
          stCity: 'Receiver City',
          spCity: 'Shipper City',
          stState: 'Receiver State',
          spState: 'Shipper State',
          stMobile: 'Receiver Mobile',
          spMobile: 'Shipper Mobile',
          stZip: 'Receiver Zip',
          spZip: 'Shipper Zip',
          stTaxNo: 'Receiver Tax No.',
          spTaxNo: 'Shipper Tax No.',
          isDefault: 'Default',
          formName: 'Name',
          formCompany: 'Company',
          formPhone: 'Phone',
          formMobile: 'Mobile',
          formEmail: 'Email',
          formAddress: 'Address',
          formState: 'State',
          formCity: 'City',
          formZip: 'Zip',
          formTaxNo: 'Tax No.',
          form: {
            namePlaceholder: 'Please enter name',
            countryPlaceholder: 'Select destination',
            phonePlaceholder: 'Please enter phone',
            mobilePlaceholder: 'Please enter mobile',
            emailPlaceholder: 'Please enter email',
            addressPlaceholder: 'Please enter address',
            statePlaceholder: 'Please enter state',
            cityPlaceholder: 'Please enter city',
            zipPlaceholder: 'Please enter zip'
          },
          fileName: 'File Name',
          uploader: 'Uploaded By',
          uploadTime: 'Uploaded At',
          download: 'Download',
          batchUpload: 'Batch Upload',
          selectFileFirst: 'Please select files to upload first',
          uploadSuccess: 'Uploaded successfully',
          webOrder: 'Web Ordering',
          webOrderDesc: 'Web login ordering permission and account',
          apiOrder: 'API Ordering',
          apiOrderDesc: 'API ordering credentials and status',
          openStatus: 'Status',
          webAccount: 'Account',
          webPassword: 'Password',
          resetPassword: 'Reset Password',
          resetPasswordTip: 'Reset the password? It will be reset to the initial password pwd123456',
          resetPasswordSuccess: 'Password has been reset to pwd123456',
          copy: 'Copy',
          copySuccess: 'Copied to clipboard',
          operator: 'Operator',
          operationLog: 'Operation',
          operationTime: 'Operation Time'
        }
      },
      setting: {
        inputFormat: {
          title: 'Input Format',
          name: 'Format Name',
          customerEnable: 'Customer Enabled',
          isDefault: 'Default',
          order: 'Sort',
          yes: 'Yes',
          no: 'No',
          newTitle: 'New Input Format',
          editTitle: 'Edit Input Format',
          namePlaceholder: 'Please enter format name',
          orderPlaceholder: 'Please enter sort',
          lastOperation: 'Last Operator',
          lastUpdateTime: 'Last Update Time',
          remarkPlaceholder: 'Please enter remark'
        },
        printFormat: {
          title: 'Print Format',
          listTitle: 'Print Format Type',
          name: 'Template Name',
          category: 'Category',
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
          name: 'Template Name',
          templateType: 'Template Type',
          type: {
            sysList: 'System List',
            sendList: 'Shipping List',
            billRec: 'Receivable Bill',
            billPay: 'Payable Bill',
            blLoadList: 'B/L Packing List',
            blInvoice: 'B/L Invoice',
            blFile: 'B/L Document',
            blCustoms: 'Customs Documents',
            shipOrder: 'Waybill Detail'
          },
          excelTemplate: 'Excel Template',
          excelTemplateRequired: 'Please upload the Excel template',
          thPos: 'Header Start Cell',
          tdPos: 'Data Start Cell',
          note: 'Remark',
          lastOperation: 'Last Operation',
          lastUpdateTime: 'Last Update Time',
          download: 'Download',
          downloadMissing: 'Template file does not exist, cannot download',
          newTitle: 'New Export Template',
          editTitle: 'Edit Export Template',
          uploadParseSuccess: 'Parsed: {info} info fields / {list} list fields'
        },
        traceCapture: {
          title: 'Trace Capture Config',
          subTab: {
            trackNetwork: 'Track Network',
            trackTransform: 'Track Transform',
            trackKeyword: 'Track Keyword',
            captureTime: 'Capture Time'
          },
          col: {
            name: 'Name',
            trackType: 'System Type',
            url: 'Server URL',
            lastEditor: 'Last Editor',
            editTime: 'Edit Time',
            node: 'Node',
            timeFormat: 'Time Format',
            location: 'Location',
            description: 'Description',
            published: 'Published',
            statusName: 'Status Name',
            keywordDefinition: 'Trace Keyword Judgment Definition',
            ruleName: 'Rule Name',
            common: 'Global Common',
            trackNetworks: 'Track Networks',
            keywordGroup: 'Keyword Group',
            waybillStatus: 'Waybill Status'
          },
          form: {
            name: 'Network Name',
            namePlaceholder: 'Please enter name',
            trackType: 'System Type',
            url: 'Server URL',
            urlPlaceholder: 'Please enter server url',
            fieldPlaceholder: 'Please enter',
            web: 'Tracking URL',
            webPlaceholder: 'Please enter tracking url',
            node: 'Node',
            nodePlaceholder: 'Please enter node',
            timeFormat: 'Time Format',
            timeFormatPlaceholder: 'e.g. YYYY-MM-DD HH:mm',
            location: 'Location',
            locationPlaceholder: 'Please enter location',
            description: 'Description',
            descriptionPlaceholder: 'Please enter description',
            published: 'Published',
            statusName: 'Status Name',
            statusNamePlaceholder: 'Please enter status name',
            keywordDefinition: 'Trace Keyword Judgment Definition',
            keywordDefinitionPlaceholder: 'Enter keywords, separate multiple keywords with commas',
            ruleName: 'Rule Name',
            ruleNamePlaceholder: 'Please enter rule name',
            common: 'Global Common',
            configIds: 'Track Networks',
            configIdsPlaceholder: 'Please select track networks',
            keywordGroup: 'Keyword Group',
            keywordGroupPlaceholder: 'Enter keywords, separate multiple keywords with commas',
            waybillStatus: 'Waybill Status'
          },
          addRow: 'Add',
          waybillStatusOption: {
            inTransit: 'In Transit',
            delivered: 'Delivered',
            exception: 'Exception',
            returned: 'Returned'
          },
          timeFormatOption: {
            ymd: 'Year-Month-Day',
            ymdHm: 'Year-Month-Day Hour:Minute',
            ymdHms: 'Year-Month-Day Hour:Minute:Second'
          },
          createTitle: 'Create',
          editTitle: 'Edit',
          captureTime: {
            entry: 'Capture Time Settings',
            title: 'Capture Time Settings',
            desc: 'The system will automatically capture tracks at the following times every day',
            addTime: 'Add Time',
            saveConfig: 'Save Config',
            timePlaceholder: 'Please select time',
            duplicateTime: 'Duplicate capture time exists',
            emptyTime: 'Please select capture time',
            col: {
              log: 'Operation Log',
              system: 'Operating System',
              opType: 'Operation Type',
              operator: 'Operator',
              opTime: 'Operation Time'
            }
          }
        },
        operationTrace: {
          title: 'Operation Trace Config',
          col: {
            opType: 'Operation Node',
            timeType: 'Time Format',
            place: 'Service Location',
            desc: 'Description',
            status: 'Published'
          },
          placeOption: {
            waybillOrigin: '[运单出发地]',
            destination: '[目的地]'
          },
          addRow: 'Add Row',
          opTypeOption: {
            forecast: 'Waybill Forecast',
            pickup: 'Waybill Pickup',
            inbound: 'Waybill Inbound',
            outbound: 'Waybill Outbound',
            delivery: 'Waybill Delivery'
          },
          timeTypeOption: {
            ymd: 'YYYY-MM-DD',
            ymdHm: 'YYYY-MM-DD HH:mm',
            ymdHms: 'YYYY-MM-DD HH:mm:ss'
          },
          batchSave: 'Batch Save',
          saveSuccess: 'Saved',
          saveFailed: 'Save failed'
        },
        basicConfig: {
          title: 'Basic Config',
          infoCard: 'Basic Information',
          ruleCard: 'System Control',
          info: {
            companyName: 'Company Name',
            companyAddress: 'Company Address',
            companyUrl: 'Company URL',
            systemName: 'System Name',
            contactPhone: 'Contact Phone',
            staffLogin: 'Staff Login',
            companyLogo: 'Company Logo',
            defaultOrigin: 'Default Origin',
            customerLogin: 'Customer Login'
          },
          rule: {
            feeTotalStrategy: 'Total Fee Rounding Rule',
            feeTotalCtrl: 'Negative Freight Allowed',
            weightCtrl: 'Zero Weight Allowed',
            noCtrl: 'Duplicate Internal No.',
            channelNoCtrl: 'Duplicate Channel No.',
            outInWeightDiffNotify: 'Notify Outbound < Inbound Weight',
            outWeightDiffNotify: 'Outbound Weight Diff Threshold (KG)',
            returnWeightDiffNotify: 'Return Weight Diff Threshold (KG)'
          },
          option: {
            notRound: 'No Rounding (2 decimals)',
            roundDown: 'Round Down',
            roundHalfUp: 'Round Half Up',
            allow: 'Allow',
            deny: 'Not Allow',
            notify: 'Notify',
            notNotify: 'No Notify'
          }
        },
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
    order: {
      packTypeOption: {
        package: 'Package',
        bag: 'Bag',
        file: 'File'
      },
      packTypePlaceholder: 'Please select package type'
    },
    personalCenter: {
      profileInfo: 'Basic Info',
      changePassword: 'Change Password',
      accountInfo: 'Account Info',
      profileForm: 'Profile',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      form: {
        newPasswordPlaceholder: 'Please enter the new password',
        confirmPasswordPlaceholder: 'Please enter the new password again'
      },
      passwordNotMatch: 'The two passwords entered do not match',
      backendNotOpen:
        'Changing password is not available yet: the backend currently does not allow users to change their own password.',
      editInfoDisabled: 'Your role is not allowed to edit personal information. Please contact the administrator.'
    },
    dataManage: {
      common: {
        createTime: 'Created Time',
        keywordPlaceholder: 'Please enter name or code'
      },
      basic: {
        title: 'General',
        countryRegion: {
          title: 'Country / Region',
          code: 'Country Code',
          nameCn: 'Chinese Name',
          nameEn: 'English Name',
          name: 'Common Name',
          code2: 'ISO2',
          code3: 'ISO3',
          form: {
            codePlaceholder: 'Enter country code',
            nameCnPlaceholder: 'Enter Chinese name'
          }
        },
        fbaWarehouse: {
          title: 'FBA Warehouse',
          code: 'Warehouse Code',
          warehouse: 'Warehouse Name',
          name: 'Recipient',
          phone: 'Phone',
          address: 'Address',
          city: 'City',
          state: 'State',
          zip: 'Zip',
          country: 'Country',
          form: {
            codePlaceholder: 'Enter warehouse code',
            warehousePlaceholder: 'Enter warehouse name'
          }
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
          title: 'Currency',
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
        title: 'Waybill',
        code: 'Code',
        name: 'Name',
        form: { codePlaceholder: 'Enter code', namePlaceholder: 'Enter name' },
        address: { title: 'Address Book' },
        declaredGoods: { title: 'Declared Goods' },
        problemCategory: { title: 'Problem Category' },
        goodsCategory: { title: 'Goods Category' },
        customsType: { title: 'Customs Type' },
        exportReason: { title: 'Export Reason' },
        clearanceMethod: { title: 'Clearance Method' },
        salesTerms: { title: 'Sales Terms' }
      },
      bl: {
        title: 'Bill of Lading',
        blRoute: {
          title: 'Route',
          code: 'Route Code',
          name: 'Route Name',
          form: { codePlaceholder: 'Enter route code', namePlaceholder: 'Enter route name' }
        },
        blPort: {
          title: 'Port',
          code: 'Port Code',
          name: 'Port Name',
          country: 'Country',
          form: { codePlaceholder: 'Enter port code', namePlaceholder: 'Enter port name' }
        },
        blTrip: {
          title: 'Vessel / Voyage',
          name: 'Vessel',
          voyage: 'Voyage',
          etd: 'ETD',
          form: { namePlaceholder: 'Enter vessel', voyagePlaceholder: 'Enter voyage' }
        },
        blAddress: {
          title: 'Address Book',
          typeOption: {
            BY: 'Buyer Company',
            ST: 'Ship To',
            CN: 'Consignee',
            SE: 'Seller Company',
            MF: 'Manufacturer',
            IM: 'Importer',
            BKP: 'Booking Party',
            CS: 'Consolidator',
            LG: 'Loading Address'
          },
          form: {
            namePlaceholder: 'Enter name',
            companyPlaceholder: 'Enter company',
            phonePlaceholder: 'Enter phone',
            cityPlaceholder: 'Enter city',
            statePlaceholder: 'Enter state',
            zipPlaceholder: 'Enter zip',
            addressPlaceholder: 'Enter address'
          }
        },
        blUnit: {
          title: 'Container Type',
          code: 'Container Code',
          name: 'Container Name',
          size: 'Size',
          form: { codePlaceholder: 'Enter container code', namePlaceholder: 'Enter container name' }
        },
        trackConfig: {
          title: 'Track Config',
          name: 'Config Name',
          carrier: 'Carrier',
          url: 'Fetch URL',
          form: { namePlaceholder: 'Enter config name', carrierPlaceholder: 'Enter carrier' }
        }
      },
      noRule: {
        title: 'Number Rule',
        itemNoRule: { title: 'Sub Number Rule' },
        noPool: { title: 'Waybill Number Pool' },
        longNoRule: { title: 'Long Number Truncate' },
        name: 'Name',
        prefix: 'Prefix',
        suffix: 'Suffix',
        start: 'Start Value',
        end: 'End Value',
        current: 'Current Value',
        len: 'Digit Length',
        checkType: 'Check Digit',
        sysType: 'System Type',
        sysTypeAll: 'All Types',
        lastOperation: 'Last Operation',
        lastUpdateTime: 'Last Update Time',
        newTitle: 'New Number Rule',
        editTitle: 'Edit Number Rule',
        sysTypeForbidDelete: 'System-type rules cannot be deleted',
        checkTypeOption: {
          none: 'No Check Digit',
          weighted: 'Weighted Check',
          mod7: 'Mod 7 Check'
        },
        sysTypeOption: {
          custom: 'Custom',
          waybill: 'Waybill No.',
          customer: 'Customer No.'
        },
        form: {
          namePlaceholder: 'Enter rule name',
          prefixPlaceholder: 'Enter prefix (auto uppercase on save)',
          suffixPlaceholder: 'Enter suffix (auto uppercase on save)',
          startPlaceholder: 'Enter start value',
          endPlaceholder: 'Enter end value',
          currentPlaceholder: 'Enter current value',
          lenPlaceholder: 'Enter digit length',
          notePlaceholder: 'Enter remark',
          positiveInt: 'Please enter a positive integer'
        }
      },
      ship: {
        provider: {
          title: 'Provider',
          code: 'Provider Code',
          name: 'Provider Name',
          billMode: 'Settlement',
          contact: 'Contact',
          phone: 'Phone',
          email: 'Email',
          web: 'Website',
          address: 'Address',
          balance: 'Balance',
          providerType: 'Provider Type',
          typeOption: { out: 'Shipping Provider', send: 'Delivery Provider', bl: 'BL Provider', other: 'Misc Provider' }
        },
        channelGroup: {
          title: 'Channel Category',
          name: 'Category Name',
          nameEn: 'English Name',
          order: 'Order'
        },
        weightRule: {
          title: 'Weight Rule',
          calcMode: 'Calc Mode',
          mode: 'Calc Type',
          weightOff: 'Volumetric Ratio',
          cubicNum: 'Cubic Divisor',
          order: 'Order',
          calcModeOption: { byKg: 'By Weight', byCubic: 'By Volume' },
          modeOption: {
            m0: 'Sum of Real Weight',
            m1: 'Sum of Volumetric Weight',
            m2: 'Max of Totals',
            m3: 'Sum of Chargeable Weight'
          },
          carry: 'Carry Rule',
          carryOption: {
            c0: 'Round Per-piece Real & Volumetric',
            c1: 'Round Per-piece Chargeable',
            c2: 'Round Shipment Totals',
            c3: 'Round Shipment Chargeable'
          },
          carryGroup: 'Carry Group',
          addCarryGroup: 'Add Carry Group',
          addRule: 'Add Range',
          removeCarryGroup: 'Remove Group',
          removeRule: 'Remove',
          start: 'Start Weight',
          end: 'End Weight',
          unit: 'Weight Unit'
        },
        carrier: {
          title: 'Carrier Network',
          name: 'Network Name',
          weightRule: 'Weight Rule',
          trackConfig: 'Track Config',
          oilRate: 'Fuel Rate',
          feeCustom: 'Customs Fee',
          cubicNum: 'Cubic Divisor',
          weightOff: 'Volumetric Ratio',
          order: 'Order'
        }
      }
    },
    channelQuote: {
      common: {
        createTime: 'Created Time',
        keywordPlaceholder: 'Please enter name or code'
      },
      receive: {
        title: 'Receive Channel',
        code: 'Channel Code',
        name: 'Channel Name',
        form: { codePlaceholder: 'Please enter channel code', namePlaceholder: 'Please enter channel name' }
      },
      ship: {
        title: 'Ship Channel',
        code: 'Channel Code',
        name: 'Channel Name',
        form: { codePlaceholder: 'Please enter channel code', namePlaceholder: 'Please enter channel name' }
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
      invalid: '3-18 characters, including letters, numbers, and special characters'
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
