declare namespace Api {
  namespace DeclaredGoods {
    /** 申报物品（product） */
    interface Product {
      _id?: string;
      customerId?: string;
      countryId?: string;
      nameCn: string;
      nameEn: string;
      hsCode?: string;
      destHsCode?: string;
      price?: number;
      currency?: string;
      weight?: number;
      unit?: string;
      producer?: string;
      brand?: string;
      material?: string;
      use?: string;
      model?: string;
      standard?: string;
      feeCustom?: number;
      taxRate?: number;
      sku?: string;
      sellUrl?: string;
      note?: string;
      imgUrl?: string;
      createDate?: number;
      updateDate?: number;
    }

    /** 清关目的地（product-country） */
    interface ProductCountry {
      _id?: string;
      code: string;
      nameCn: string;
      nameEn?: string;
      name?: string;
      code2?: string;
      code3?: string;
      order?: number;
      createDate?: number;
      updateDate?: number;
    }

    interface QueryParams {
      page: number;
      size: number;
      keyword?: string;
      keywordFields?: string[];
      where?: Record<string, unknown>;
    }

    interface QueryResult<T> {
      list: T[];
      total: number;
    }
  }
}
