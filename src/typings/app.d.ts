/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** NaiveUI theme overrides that can be specified in preset */
    type NaiveUIThemeOverride = import('naive-ui').GlobalThemeOverrides;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Theme radius */
      themeRadius: number;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
        globalSearch: {
          /** Whether to show the GlobalSearch */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
        /** Whether to close tab by middle click */
        closeTabByMiddleClick: boolean;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixWidth: number;
        /**
         * Collapsed sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or
         * 'top-hybrid-header-first'
         */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixChildMenuWidth: number;
        /** Whether to auto select the first submenu */
        autoSelectFirstMenu: boolean;
        /** Whether the sidebar menu is accordion (only one submenu expanded at a time) */
        accordion: boolean;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /**
         * Whether float the footer to the right when the layout is 'top-hybrid-sidebar-first' or
         * 'top-hybrid-header-first'
         */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
        /** Whether to use user name as watermark text */
        enableUserName: boolean;
        /** Whether to use current time as watermark text */
        enableTime: boolean;
        /** Time format for watermark text */
        timeFormat: string;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The router push options */
    type RouterPushOptions = {
      query?: Record<string, string>;
      params?: Record<string, string>;
      force?: boolean;
    };

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll' | 'pin' | 'unpin';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        action: string;
        expandFilter: string;
        collapseFilter: string;
        add: string;
        addSuccess: string;
        saveSuccess: string;
        submitModify: string;
        backToHome: string;
        batchDelete: string;
        batchDisable: string;
        cancel: string;
        close: string;
        check: string;
        selectAll: string;
        clear: string;
        unselectAll: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        login: string;
        drag: string;
        iconPicker: {
          placeholder: string;
          clear: string;
          search: string;
          empty: string;
          all: string;
          iconify: string;
        };
        show: string;
        treeNodeColumnLocked: string;
        name: string;
        fixed: string;
        width: string;
        minWidth: string;
        autoDefault: string;
        sortable: string;
        unFixed: string;
        fixedLeft: string;
        fixedRight: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        confirmEnable: string;
        confirmDisable: string;
        copy: string;
        chooseFile: string;
        upload: {
          exceedSize: string;
          draggerText: string;
          invalidType: string;
        };
        copySuccess: string;
        copyFailed: string;
        createSuccess: string;
        updateSuccess: string;
        batchDisableSuccess: string;
        detail: string;
        edit: string;
        enable: string;
        disable: string;
        warning: string;
        error: string;
        index: string;
        keywordSearch: string;
        keyword: string;
        status: string;
        remark: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        save: string;
        userCenter: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
        devInProgress: string;
        excelTemplate: string;
        export: string;
        exportFields: string;
        exportSelectedCount: string;
        exportSuccess: string;
        exportFailed: string;
        exportScope: string;
        exportScopeAll: string;
        exportScopePage: string;
        exportScopeChecked: string;
        exportScopeCheckedEmpty: string;
        exportScopeAllUnavailable: string;
        addField: string;
        customField: string;
        fieldName: string;
        fieldNamePlaceholder: string;
        dataField: string;
        dataFieldPlaceholder: string;
        valueMode: string;
        valueModeField: string;
        valueModeFixed: string;
        fixedValuePlaceholder: string;
        notSupported: string;
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeDrawerTitle: string;
        tabs: {
          appearance: string;
          layout: string;
          general: string;
          preset: string;
        };
        appearance: {
          themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
          grayscale: string;
          colourWeakness: string;
          themeColor: {
            title: string;
            followPrimary: string;
          } & Record<Theme.ThemeColorKey, string>;
          recommendColor: string;
          recommendColorDesc: string;
          themeRadius: {
            title: string;
          };
          preset: {
            title: string;
            apply: string;
            applySuccess: string;
            [key: string]:
              | {
                  name: string;
                  desc: string;
                }
              | string;
          };
        };
        layout: {
          layoutMode: { title: string } & Record<UnionKey.ThemeLayoutMode, string> & {
              [K in `${UnionKey.ThemeLayoutMode}_detail`]: string;
            };
          tab: {
            title: string;
            visible: string;
            cache: string;
            cacheTip: string;
            height: string;
            mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
            closeByMiddleClick: string;
            closeByMiddleClickTip: string;
          };
          header: {
            title: string;
            height: string;
            breadcrumb: {
              visible: string;
              showIcon: string;
            };
          };
          sider: {
            title: string;
            inverted: string;
            width: string;
            collapsedWidth: string;
            mixWidth: string;
            mixCollapsedWidth: string;
            mixChildMenuWidth: string;
            autoSelectFirstMenu: string;
            autoSelectFirstMenuTip: string;
            accordion: string;
          };
          footer: {
            title: string;
            visible: string;
            fixed: string;
            height: string;
            right: string;
          };
          content: {
            title: string;
            scrollMode: { title: string; tip: string } & Record<UnionKey.ThemeScrollMode, string>;
            page: {
              animate: string;
              mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
            };
            fixedHeaderAndTab: string;
          };
        };
        general: {
          title: string;
          watermark: {
            title: string;
            visible: string;
            text: string;
            enableUserName: string;
            enableTime: string;
            timeFormat: string;
          };
          multilingual: {
            title: string;
            visible: string;
          };
          globalSearch: {
            title: string;
            visible: string;
          };
        };
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      page: {
        login: {
          common: {
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
            title: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: {
          branchDesc: string;
          greeting: string;
          weatherDesc: string;
          projectCount: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        manage: {
          user: {
            userName: string;
            nickName: string;
            roleName: string;
            password: string;
            siteName: string;
            groupName: string;
            status: string;
            keyword: string;
            idCard: string;
            unknown: string;
            basicInfo: string;
            profileInfo: string;
            realName: string;
            contactPhone: string;
            position: string;
            gender: string;
            male: string;
            female: string;
            email: string;
            hireDate: string;
            birthday: string;
            wechat: string;
            attachment: string;
            homeAddress: string;
            otherContact: string;
            remark: string;
            wechatQrcode: string;
            createTime: string;
            relationCustomer: string;
            editPage: {
              creator: string;
              update: string;
              tabPerm: string;
              tabAccount: string;
            };
            form: {
              userNamePlaceholder: string;
              nickNamePlaceholder: string;
              roleNamePlaceholder: string;
              passwordPlaceholder: string;
              passwordEditPlaceholder: string;
              siteNamePlaceholder: string;
              groupNamePlaceholder: string;
              statusPlaceholder: string;
              keywordPlaceholder: string;
              idCardPlaceholder: string;
              realNamePlaceholder: string;
              contactPhonePlaceholder: string;
              positionPlaceholder: string;
              genderPlaceholder: string;
              emailPlaceholder: string;
              hireDatePlaceholder: string;
              birthdayPlaceholder: string;
              wechatPlaceholder: string;
              homeAddressPlaceholder: string;
              otherContactPlaceholder: string;
              remarkPlaceholder: string;
            };
          };
          role: {
            roleName: string;
            roleType: string;
            desc: string;
            refId: string;
            dataAuths: string;
            order: string;
            creator: string;
            createTime: string;
            updateBy: string;
            updateTime: string;
            roleTypes: {
              service: string;
              sales: string;
              operation: string;
              finance: string;
              manager: string;
              admin: string;
            };
            dataAuthOptions: {
              user: string;
              group: string;
            };
            restrictSection: string;
            ctrlOptions: {
              allow: string;
              deny: string;
              enable: string;
              disable: string;
            };
            ctrls: {
              sendOrder: string;
              sendCtrl: string;
              orderCol: string;
              editInfo: string;
              editPwd: string;
            };
            permission: string;
            relationUser: string;
            permissionTip: string;
            permissionDisabledTip: string;
            builtIn: string;
            builtInEditTip: string;
            builtInDeleteTip: string;
            builtInBatchDeleteTip: string;
            searchMenuPlaceholder: string;
            loadMenuFailed: string;
            form: {
              roleNamePlaceholder: string;
              roleTypePlaceholder: string;
              refIdPlaceholder: string;
              orderPlaceholder: string;
              descPlaceholder: string;
            };
          };
          site: {
            code: string;
            name: string;
            concat: string;
            phone: string;
            workTime: string;
            startPlace: string;
            address: string;
            note: string;
            siteType: string;
            siteTypeBranch: string;
            siteTypeHeadquarters: string;
            updateDate: string;
            keyword: string;
            relationUser: string;
            relationCustomer: string;
            view: string;
            customerCode: string;
            customerName: string;
            siteName: string;
            form: {
              codePlaceholder: string;
              namePlaceholder: string;
              concatPlaceholder: string;
              phonePlaceholder: string;
              workTimePlaceholder: string;
              startPlacePlaceholder: string;
              addressPlaceholder: string;
              notePlaceholder: string;
              siteTypePlaceholder: string;
              keywordPlaceholder: string;
            };
          };
          opLog: {
            opName: string;
            creator: string;
            client: string;
            opType: string;
            refNames: string;
            ip: string;
            desc: string;
            createDate: string;
            detail: string;
            logTitle: string;
            noDetail: string;
            clientOption: {
              tms: string;
              pc: string;
              pda: string;
              oms: string;
            };
            opTypeOption: {
              login: string;
              update: string;
              del: string;
              logout: string;
              trace: string;
            };
            form: {
              dateRange: string;
              opType: string;
              client: string;
              keyword: string;
              keywordPlaceholder: string;
              opTypePlaceholder: string;
              clientPlaceholder: string;
            };
            log: {
              name: string;
              oldValue: string;
              newValue: string;
              desc: string;
            };
          };
          group: {
            groupName: string;
            siteName: string;
            relationUser: string;
            relationCustomer: string;
            remark: string;
            creator: string;
            createTime: string;
            updateBy: string;
            updateTime: string;
            form: {
              groupNamePlaceholder: string;
              siteNamePlaceholder: string;
              remarkPlaceholder: string;
            };
          };
          customer: {
            keyword: string;
            customerCode: string;
            customerName: string;
            account: string;
            customerLevel: string;
            customerSource: string;
            contactName: string;
            contactPhone: string;
            email: string;
            address: string;
            wx: string;
            qq: string;
            tag: string;
            taxInfo: string;
            status: string;
            remark: string;
            basicInfo: string;
            settlementInfo: string;
            handlerInfo: string;
            billMode: string;
            withhold: string;
            creditLimit: string;
            contractRange: string;
            billGenMode: string;
            billGenStatus: string;
            site: string;
            group: string;
            salesman: string;
            service: string;
            picker: string;
            cashier: string;
            webStatus: string;
            createDate: string;
            deleteDisabledTip: string;
            form: {
              keywordPlaceholder: string;
              codePlaceholder: string;
              namePlaceholder: string;
              accountPlaceholder: string;
              contactPlaceholder: string;
              mobilePlaceholder: string;
              emailPlaceholder: string;
              addressPlaceholder: string;
              sourcePlaceholder: string;
              levelPlaceholder: string;
              statusPlaceholder: string;
              billModePlaceholder: string;
              withholdPlaceholder: string;
              creditLimitPlaceholder: string;
              billGenModePlaceholder: string;
              sitePlaceholder: string;
              groupPlaceholder: string;
              salesmanPlaceholder: string;
              servicePlaceholder: string;
              pickerPlaceholder: string;
              cashierPlaceholder: string;
            };
            detail: {
              title: string;
              addressBook: string;
              fbaCode: string;
              customer: string;
              stCountry: string;
              spCountry: string;
              address2: string;
              address3: string;
              idCardFront: string;
              idCardBack: string;
              bizFinance: string;
              shipTo: string;
              shipper: string;
              fileManage: string;
              apiConfig: string;
              opLog: string;
              billPeriod: string;
              billDay: string;
              billPerson: string;
              billGenStatus: string;
              keyword: string;
              search: string;
              addressSearchPlaceholder: string;
              addressTag: string;
              destination: string;
              stName: string;
              spName: string;
              stCompany: string;
              spCompany: string;
              stPhone: string;
              spPhone: string;
              stEmail: string;
              spEmail: string;
              stAddress: string;
              spAddress: string;
              stCity: string;
              spCity: string;
              stState: string;
              spState: string;
              stMobile: string;
              spMobile: string;
              stZip: string;
              spZip: string;
              stTaxNo: string;
              spTaxNo: string;
              isDefault: string;
              formName: string;
              formCompany: string;
              formPhone: string;
              formMobile: string;
              formEmail: string;
              formAddress: string;
              formState: string;
              formCity: string;
              formZip: string;
              formTaxNo: string;
              form: {
                namePlaceholder: string;
                countryPlaceholder: string;
                phonePlaceholder: string;
                mobilePlaceholder: string;
                emailPlaceholder: string;
                addressPlaceholder: string;
                statePlaceholder: string;
                cityPlaceholder: string;
                zipPlaceholder: string;
                customerPlaceholder: string;
              };
              fileName: string;
              uploader: string;
              uploadTime: string;
              download: string;
              batchUpload: string;
              selectFileFirst: string;
              uploadSuccess: string;
              webOrder: string;
              webOrderDesc: string;
              apiOrder: string;
              apiOrderDesc: string;
              openStatus: string;
              webAccount: string;
              webPassword: string;
              resetPassword: string;
              resetPasswordTip: string;
              resetPasswordSuccess: string;
              copy: string;
              copySuccess: string;
              operator: string;
              operationLog: string;
              operationTime: string;
            };
          };
          setting: {
            inputFormat: {
              title: string;
              name: string;
              customerEnable: string;
              isDefault: string;
              order: string;
              yes: string;
              no: string;
              setDefault: string;
              newTitle: string;
              editTitle: string;
              namePlaceholder: string;
              orderPlaceholder: string;
              lastOperation: string;
              lastUpdateTime: string;
              remarkPlaceholder: string;
            };
            printFormat: {
              title: string;
              listTitle: string;
              name: string;
              category: string;
              labelSize: string;
              isDefault: string;
              yes: string;
              no: string;
              generatedCount: string;
              remark: string;
              lastEditor: string;
              editTime: string;
              create: string;
              delete: string;
              view: string;
              copy: string;
              setDefault: string;
              newTitle: string;
              detailTitle: string;
              copyTitle: string;
              design: string;
            };
            exportFormat: {
              title: string;
              name: string;
              templateType: string;
              type: {
                sysList: string;
                sendList: string;
                billRec: string;
                billPay: string;
                blLoadList: string;
                blInvoice: string;
                blFile: string;
                blCustoms: string;
                shipOrder: string;
              };
              excelTemplate: string;
              excelTemplateRequired: string;
              thPos: string;
              tdPos: string;
              note: string;
              lastOperation: string;
              lastUpdateTime: string;
              download: string;
              downloadMissing: string;
              newTitle: string;
              editTitle: string;
              uploadParseSuccess: string;
            };
            traceCapture: {
              title: string;
              traceInfoTransform: string;
              transformRules: string;
              addRuleRow: string;
              subTab: {
                trackNetwork: string;
                trackTransform: string;
                trackKeyword: string;
                captureTime: string;
              };
              col: {
                name: string;
                trackType: string;
                url: string;
                lastEditor: string;
                editTime: string;
                node: string;
                timeFormat: string;
                location: string;
                description: string;
                published: string;
                statusName: string;
                keywordDefinition: string;
                ruleName: string;
                common: string;
                trackNetworks: string;
                keywordGroup: string;
                waybillStatus: string;
                oriStr: string;
                replaceStr: string;
              };
              form: {
                name: string;
                namePlaceholder: string;
                trackType: string;
                url: string;
                urlPlaceholder: string;
                fieldPlaceholder: string;
                web: string;
                webPlaceholder: string;
                node: string;
                nodePlaceholder: string;
                timeFormat: string;
                timeFormatPlaceholder: string;
                location: string;
                locationPlaceholder: string;
                description: string;
                descriptionPlaceholder: string;
                published: string;
                statusName: string;
                statusNamePlaceholder: string;
                keywordDefinition: string;
                keywordDefinitionPlaceholder: string;
                ruleName: string;
                ruleNamePlaceholder: string;
                common: string;
                configIds: string;
                configIdsPlaceholder: string;
                keywordGroup: string;
                keywordGroupPlaceholder: string;
                waybillStatus: string;
              };
              addRow: string;
              waybillStatusOption: {
                inTransit: string;
                delivered: string;
                exception: string;
                returned: string;
              };
              timeFormatOption: {
                ymd: string;
                ymdHm: string;
                ymdHms: string;
              };
              createTitle: string;
              editTitle: string;
              captureTime: {
                entry: string;
                title: string;
                desc: string;
                addTime: string;
                saveConfig: string;
                timePlaceholder: string;
                duplicateTime: string;
                emptyTime: string;
                col: {
                  log: string;
                  system: string;
                  opType: string;
                  operator: string;
                  opTime: string;
                };
              };
            };
            operationTrace: {
              title: string;
              col: {
                opType: string;
                timeType: string;
                place: string;
                desc: string;
                status: string;
              };
              placeOption: {
                waybillOrigin: string;
                destination: string;
              };
              addRow: string;
              opTypeOption: {
                forecast: string;
                pickup: string;
                inbound: string;
                outbound: string;
                delivery: string;
              };
              timeTypeOption: {
                ymd: string;
                ymdHm: string;
                ymdHms: string;
              };
              batchSave: string;
              saveSuccess: string;
              saveFailed: string;
            };
            basicConfig: {
              title: string;
              infoCard: string;
              ruleCard: string;
              info: {
                companyName: string;
                companyAddress: string;
                companyUrl: string;
                systemName: string;
                contactPhone: string;
                staffLogin: string;
                companyLogo: string;
                defaultOrigin: string;
                customerLogin: string;
              };
              rule: {
                feeTotalStrategy: string;
                feeTotalCtrl: string;
                weightCtrl: string;
                noCtrl: string;
                channelNoCtrl: string;
                outInWeightDiffNotify: string;
                outWeightDiffNotify: string;
                returnWeightDiffNotify: string;
              };
              option: {
                notRound: string;
                roundDown: string;
                roundHalfUp: string;
                allow: string;
                deny: string;
                notify: string;
                notNotify: string;
              };
            };
            fieldMapping: string;
            fieldMappingRequired: string;
            fieldMappingSummary: string;
            fieldMappingCounts: string;
            fieldMappingGroupAll: string;
            fieldMappingSearchPlaceholder: string;
            fieldMappingOnlyShown: string;
            fieldMappingNoMatch: string;
            fieldMappingLockedTip: string;
          };
          printDesign: {
            title: string;
            back: string;
            paper: string;
            zoomOut: string;
            zoomIn: string;
            showGrid: string;
            hideGrid: string;
            showRuler: string;
            hideRuler: string;
            clear: string;
            clearConfirm: string;
            clearContent: string;
            save: string;
            preview: string;
            fields: string;
            basicElements: string;
            basicText: string;
            basicLongText: string;
            basicImage: string;
            basicBarcode: string;
            basicQrcode: string;
            basicTable: string;
            basicHline: string;
            basicVline: string;
            basicRect: string;
            canvas: string;
            properties: string;
            print: string;
            loadFailed: string;
            saveSuccess: string;
            noTemplate: string;
            propertyEmpty: string;
          };
          labelDesign: {
            title: string;
            basicElements: string;
            fields: string;
            basicText: string;
            basicLongText: string;
            basicImage: string;
            basicBarcode: string;
            basicQrcode: string;
            basicRect: string;
            basicHline: string;
            basicVline: string;
            propX: string;
            propY: string;
            propW: string;
            propH: string;
            propText: string;
            propField: string;
            propTestData: string;
            propFontSize: string;
            propColor: string;
            propWeight: string;
            propAlignH: string;
            propAlignV: string;
            propLineHeight: string;
            weightNormal: string;
            weightBold: string;
            alignLeft: string;
            alignCenter: string;
            alignRight: string;
            valignTop: string;
            valignMiddle: string;
            valignBottom: string;
            propSrc: string;
            propValue: string;
            propTextGap: string;
            propSymbology: string;
            propDisplayValue: string;
            propEcc: string;
            propBorderWidth: string;
            propBorderColor: string;
            propBgColor: string;
            propRadius: string;
            dataPreview: string;
            sectionGeo: string;
            sectionStyle: string;
            propTitleName: string;
            titleNameTip: string;
            propFieldType: string;
            propTitleFontSize: string;
            propTitleColor: string;
            propTitleWeight: string;
            propShowBorder: string;
            propLinkTitle: string;
            propPlaceholder: string;
            placeholderInputTip: string;
            fieldTypeText: string;
            fieldTypeLongText: string;
            fieldTypeBarcode: string;
            fieldTypeQrcode: string;
            fieldTypeImage: string;
            fieldLabel: string;
            fieldUnbound: string;
            noSelection: string;
            deleteElement: string;
            undo: string;
            redo: string;
            grid: string;
            back: string;
            clear: string;
            clearConfirm: string;
            shortcut: string;
            shortcutWindows: string;
            shortcutMac: string;
            shortcutCopyPaste: string;
            shortcutMove: string;
            shortcutQuickMove: string;
            shortcutNudge: string;
            shortcutDelete: string;
            shortcutArrows: string;
            preview: string;
            print: string;
            resetZoom: string;
            save: string;
            saveSuccess: string;
            saveFailed: string;
            loadFailed: string;
            selectTemplate: string;
            unsavedTitle: string;
            unsavedContent: string;
          };
        };
        order: {
          packTypeOption: {
            package: string;
            bag: string;
            file: string;
          };
          packTypePlaceholder: string;
        };
        personalCenter: {
          profileInfo: string;
          changePassword: string;
          accountInfo: string;
          profileForm: string;
          newPassword: string;
          confirmPassword: string;
          form: {
            newPasswordPlaceholder: string;
            confirmPasswordPlaceholder: string;
          };
          passwordNotMatch: string;
          backendNotOpen: string;
          editInfoDisabled: string;
        };
        dataManage: {
          common: {
            createTime: string;
            keywordPlaceholder: string;
          };
          basic: {
            title: string;
            countryRegion: {
              title: string;
              code: string;
              nameCn: string;
              nameEn: string;
              name: string;
              code2: string;
              code3: string;
              form: { codePlaceholder: string; nameCnPlaceholder: string };
            };
            fbaWarehouse: {
              title: string;
              code: string;
              warehouse: string;
              name: string;
              phone: string;
              address: string;
              city: string;
              state: string;
              zip: string;
              country: string;
              form: { codePlaceholder: string; warehousePlaceholder: string };
            };
          };
          finance: {
            title: string;
            account: {
              title: string;
              alias: string;
              bank: string;
              name: string;
              no: string;
              balance: string;
              buildIn: string;
              builtInDisableTip: string;
              form: {
                namePlaceholder: string;
                aliasPlaceholder: string;
                bankPlaceholder: string;
                noPlaceholder: string;
                balancePlaceholder: string;
                notePlaceholder: string;
                keywordPlaceholder: string;
              };
            };
            currency: {
              title: string;
              code: string;
              name: string;
              country: string;
              local: string;
              localDomestic: string;
              localForeign: string;
              rate: string;
              status: string;
              keywordPlaceholder: string;
              form: {
                codePlaceholder: string;
                namePlaceholder: string;
                countryPlaceholder: string;
                ratePlaceholder: string;
                statusPlaceholder: string;
                localPlaceholder: string;
              };
            };
            expenseType: {
              title: string;
              name: string;
              scope: string;
              order: string;
              builtIn: string;
              creator: string;
              createTime: string;
              builtInDisableTip: string;
              scopeOptions: {
                orderRec: string;
                orderPay: string;
                blPay: string;
                otherPay: string;
                otherRec: string;
              };
              form: {
                namePlaceholder: string;
                scopePlaceholder: string;
                orderPlaceholder: string;
                statusPlaceholder: string;
                notePlaceholder: string;
                keywordPlaceholder: string;
              };
            };
            settlement: {
              title: string;
              name: string;
              order: string;
              billPeriod: string;
              billDay: string;
              billGenStatus: string;
              builtIn: string;
              creator: string;
              createTime: string;
              builtInDisableTip: string;
              periodOptions: { day: string; week: string; month: string };
              billDayOptions: {
                hour: string;
                week1: string;
                week2: string;
                week3: string;
                week4: string;
                week5: string;
                week6: string;
                week7: string;
                monthDay: string;
                last: string;
              };
              genStatusOptions: {
                forecast: string;
                received: string;
                outbound: string;
                transit: string;
                delivered: string;
              };
              form: {
                namePlaceholder: string;
                orderPlaceholder: string;
                billPeriodPlaceholder: string;
                billDayPlaceholder: string;
                billGenStatusPlaceholder: string;
                statusPlaceholder: string;
                notePlaceholder: string;
                keywordPlaceholder: string;
              };
            };
          };
          business: {
            title: string;
            code: string;
            name: string;
            form: { codePlaceholder: string; namePlaceholder: string };
            address: { title: string; shipTo: string; shipper: string };
            declaredGoods: {
              title: string;
              library: string;
              clearanceDestination: string;
              fields: {
                nameCn: string;
                nameEn: string;
                hsCode: string;
                destHsCode: string;
                price: string;
                currency: string;
                weight: string;
                unit: string;
                producer: string;
                brand: string;
                material: string;
                use: string;
                model: string;
                standard: string;
                feeCustom: string;
                taxRate: string;
                sku: string;
                sellUrl: string;
                imgUrl: string;
                note: string;
                customer: string;
                country: string;
                code: string;
                name: string;
                code2: string;
                code3: string;
                updateDate: string;
              };
            };
            problemCategory: { title: string; name: string; desc: string; note: string; namePlaceholder: string };
            goodsCategory: {
              title: string;
              name: string;
              note: string;
              sensitive: string;
              charged: string;
              danger: string;
              isDefault: string;
              namePlaceholder: string;
            };
            customsType: { title: string; inner: string };
            exportReason: { title: string };
            clearanceMethod: { title: string };
            salesTerms: { title: string };
          };
          bl: {
            title: string;
            blRoute: {
              title: string;
              code: string;
              name: string;
              nameCn: string;
              nameEn: string;
              routeType: string;
              order: string;
              routeTypeOption: { air: string; sea: string };
              form: { codePlaceholder: string; namePlaceholder: string };
            };
            blPort: {
              title: string;
              code: string;
              name: string;
              country: string;
              form: { codePlaceholder: string; namePlaceholder: string };
            };
            blTrip: {
              title: string;
              name: string;
              voyage: string;
              etd: string;
              form: { namePlaceholder: string; voyagePlaceholder: string };
            };
            blAddress: {
              title: string;
              typeOption: {
                BY: string;
                ST: string;
                CN: string;
                SE: string;
                MF: string;
                IM: string;
                BKP: string;
                CS: string;
                LG: string;
              };
              form: {
                namePlaceholder: string;
                companyPlaceholder: string;
                phonePlaceholder: string;
                cityPlaceholder: string;
                statePlaceholder: string;
                zipPlaceholder: string;
                addressPlaceholder: string;
              };
            };
            blUnit: {
              title: string;
              code: string;
              name: string;
              size: string;
              form: { codePlaceholder: string; namePlaceholder: string };
            };
            trackConfig: {
              title: string;
              name: string;
              carrier: string;
              url: string;
              form: { namePlaceholder: string; carrierPlaceholder: string };
            };
          };
          noRule: {
            title: string;
            itemNoRule: { title: string };
            noPool: { title: string };
            longNoRule: { title: string };
            name: string;
            prefix: string;
            suffix: string;
            start: string;
            end: string;
            current: string;
            len: string;
            checkType: string;
            sysType: string;
            sysTypeAll: string;
            lastOperation: string;
            lastUpdateTime: string;
            newTitle: string;
            editTitle: string;
            sysTypeForbidDelete: string;
            checkTypeOption: {
              none: string;
              weighted: string;
              mod7: string;
            };
            sysTypeOption: {
              custom: string;
              waybill: string;
              customer: string;
            };
            form: {
              namePlaceholder: string;
              prefixPlaceholder: string;
              suffixPlaceholder: string;
              startPlaceholder: string;
              endPlaceholder: string;
              currentPlaceholder: string;
              lenPlaceholder: string;
              notePlaceholder: string;
              positiveInt: string;
            };
          };
          ship: {
            provider: {
              title: string;
              code: string;
              name: string;
              billMode: string;
              contact: string;
              phone: string;
              email: string;
              web: string;
              address: string;
              balance: string;
              providerType: string;
              typeOption: { out: string; send: string; bl: string; other: string };
            };
            channelGroup: {
              title: string;
              name: string;
              nameEn: string;
              order: string;
            };
            weightRule: {
              title: string;
              calcMode: string;
              mode: string;
              weightOff: string;
              cubicNum: string;
              order: string;
              calcModeOption: { byKg: string; byCubic: string };
              modeOption: { m0: string; m1: string; m2: string; m3: string };
              carry: string;
              carryOption: { c0: string; c1: string; c2: string; c3: string };
              carryGroup: string;
              addCarryGroup: string;
              addRule: string;
              removeCarryGroup: string;
              removeRule: string;
              start: string;
              end: string;
              unit: string;
            };
            carrier: {
              title: string;
              name: string;
              weightRule: string;
              trackConfig: string;
              oilRate: string;
              feeCustom: string;
              cubicNum: string;
              weightOff: string;
              order: string;
            };
          };
        };
        channelQuote: {
          common: {
            createTime: string;
            keywordPlaceholder: string;
          };
          receive: {
            title: string;
            code: string;
            name: string;
            form: { codePlaceholder: string; namePlaceholder: string };
          };
          ship: {
            title: string;
            code: string;
            name: string;
            form: { codePlaceholder: string; namePlaceholder: string };
          };
        };
      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
        fixed: {
          left: string;
          right: string;
          unFixed: string;
        };
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
