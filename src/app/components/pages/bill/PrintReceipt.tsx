'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AutoComplete, Button, Divider, Form, Input, InputNumber, InputRef, notification, Select, Space, Tag } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PrintReceiptItem, PrintReceiptPayment, PrintReceiptRequest, DesignListRequest, CustomerData, MemberData } from '@/lib/types';
import { receipt, designService, customerApi, member, item as itemApi } from '@/lib/api';
import { PACKAGE_TOPUP_MAP } from '@/config/constants';
import moment from 'moment';

interface PrintReceiptProps {
  onBackToList: () => void;
  onPrintSuccess?: () => void;
}

const calcFinalPrice = (price: number = 0, discountPercent: number = 0, discount: number = 0, qty: number = 1) => {
  let final = (price || 0) * qty;
  if (discountPercent) {
    final = final * (1 - discountPercent / 100);
  }
  if (discount) {
    final = final - discount;
  }
  return parseFloat(final.toFixed(2));
};

export const shops = ['',  'Slady Fashion Pte. Ltd.','SL Studio Pte. Ltd.',];
export const saler = ['Serene', 'Yen', 'Xiao Li','Gabrielle','Staff'];
export const paymentList = ['Bank Transfer/Pay Now','PayLah', 'Wechat Pay', 'Alipay', 'Cash', 'Nets', 'VISA', 'Master', 'Union', 'Slady Voucher', 'AMEX', 'Mall Voucher'];

let index = 0;

export default function PrintReceipt({ onBackToList, onPrintSuccess }: PrintReceiptProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [payment, setPayment] = useState('');
  const [shop, setShops] = useState(1);
  const shopRef = useRef(1);
  const inputRef = useRef<InputRef>(null);
  const [newPayment, setNewPayment] = useState(paymentList);
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string; customer: CustomerData }[]>([]);
  const phoneSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // refs 持久化状态（不会触发重渲染）
  const addRef = useRef<((defaultValue?: any, insertIndex?: number) => void) | null>(null);
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(Date.now());
  const codeSearchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const items = Form.useWatch('item', form) as Array<any> | undefined;

  const totalPrice = useMemo(() => {
    // 不是数组，或者长度为0
    if (!Array.isArray(items) || items.length === 0) {
      return 0;
    }
    // 包含 undefined 元素
    if (items.some(item => item === undefined)) {
      return 0;
    }
    return (items || []).reduce((sum, cur) => {
      return sum + calcFinalPrice(cur.price, cur.discountPercent, cur.discount, cur.qty);
    }, 0);
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 屏蔽所有功能键（F1-F12, Ctrl, Alt, Shift 等）
      // 注意：只屏蔽功能键 F1-F12（以 F 开头后跟数字），不屏蔽字母 F
      const isFunctionKey = /^F\d+$/.test(e.key); // 匹配 F1, F2, ..., F12
      if (
        isFunctionKey || // F1-F12 功能键
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === "Shift"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const now = Date.now();
      if (now - lastTimeRef.current > 50) {
        bufferRef.current = '';
      }
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        e.preventDefault();
        const code = bufferRef.current;
        bufferRef.current = '';
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        
        // 调用设计接口获取价格
        const params: DesignListRequest = {
          typeList: [],
          design: code,
          searchPage: {
            desc: 1,
            page: 1,
            pageSize: 20,
            sort: 'id'
          }
        };
        
        designService.getList(params).then(async (res: any) => {
          if (res && res.data && res.data.content && res.data.content.length > 0) {
            const design = res.data.content[0];
            const price = parseInt(design['salePrice']);
            const designId = design['id'];

            // 拉库存，填充颜色/尺码（与手动选择路径一致）
            let warehouseItems: any[] = [];
            let firstColor = '';
            let firstSize = '';
            let firstItemId: number | null = null;
            try {
              const itemRes = await itemApi.getList({ designId, searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
              warehouseItems = itemRes?.data ?? [];
              // 只考慮有庫存的記錄
              const inStockItems = warehouseItems.filter((i: any) => (i.inStoreStock ?? 0) > 0);
              firstColor = inStockItems[0]?.color ?? warehouseItems[0]?.color ?? '';
              firstSize = inStockItems.find((i: any) => i.color === firstColor)?.size ?? warehouseItems.find((i: any) => i.color === firstColor)?.size ?? '';
              firstItemId = warehouseItems.find((i: any) => i.color === firstColor && i.size === firstSize)?.id ?? null;
            } catch {
              // 拉库存失败不阻断流程
            }

            const scannedData = {
              code,
              qty: 1,
              price,
              discountPercent: 0,
              discount: 0,
              color: firstColor,
              size: firstSize,
              itemId: firstItemId,
              stockType: 'inStock',
              _warehouseItems: warehouseItems,
              _codeOptions: [],
            };
            if (addRef.current) {
              addRef.current(scannedData);
            } else {
              const items = form.getFieldValue('item') || [];
              form.setFieldsValue({ item: [...items, scannedData] });
            }
          }
        }).catch((error) => {
          console.error('获取商品价格失败:', error);
          // price fetch failed silently
        });
      } else {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form]);

  const onFinish = async () => {
    if (submitting) return;
    const itemForm: any = form.getFieldsValue();
    const payment = itemForm.paymentList?.reduce((total: any, current: any) => total + parseFloat(current.amount), 0);
    const phone = normalizePhone(itemForm.customerPhone);
    const name = (itemForm.customerName || '').trim();
    
    // 处理package充值
    const packageItems = itemForm.item?.filter((item: any) => item.code && item.code.startsWith('Package'));
    let shouldTopUp = false;
    let topUpAmount = 0;
    let packageAmount = 0;
    
    if (packageItems && packageItems.length > 0 && phone) {
      // 计算Package充值金额
      for (const pkg of packageItems) {
        const match = pkg.code.match(/Package(\d+)/);
        if (match) {
          const packageValue = parseInt(match[1]);
          if (PACKAGE_TOPUP_MAP[packageValue]) {
            packageAmount += packageValue;
            topUpAmount += PACKAGE_TOPUP_MAP[packageValue];
            shouldTopUp = true;
          }
        }
      }
    }
    
    const newItem: PrintReceiptRequest = {
      ...itemForm,
      gst: 0,
      totalPrice,
      store: shop,
      address: shop === 1 ? 'Raffles City (#03-29B)' : 'Raffles Place (#04-24/25)',
      item: itemForm.item?.map((item: any) => ({ 
        ...item, 
        finalPrice: calcFinalPrice(item.price, item.discountPercent, item.discount, item.qty),
        color: item.color || '',
        size: item.size || '',
        itemId: item.itemId || null,
        stockType: item.stockType || 'inStock'
      }))
    };
    
    if (!phone && !(itemForm.customerId > 0)) {
      delete newItem.customerId;
      delete newItem.customerName;
      delete newItem.customerPhone;
    } else {
      if (phone) newItem.customerPhone = phone;
      if (name) newItem.customerName = name;
      else delete newItem.customerName;
      if (!(itemForm.customerId > 0)) delete newItem.customerId;
    }

    if (payment.toFixed(2) === totalPrice.toFixed(2)) {
      setSubmitting(true);
      try {
        // 创建销售订单，后端会自动根据 stockType=inStock 扣减库存
        await receipt.print(newItem);
        
        // 如果有package充值且有客户电话
        if (shouldTopUp && phone && itemForm.customerId) {
          try {
            await member.topUp({
              id: itemForm.customerId,
              balance: topUpAmount,
              saler: itemForm.cashier || '',
              remark: `Package充值：销售$${packageAmount}，充值$${topUpAmount}`
            });
            notification.success({ 
              message: `销售订单创建成功！已为会员充值$${topUpAmount}` 
            });
          } catch (error) {
            console.error('会员充值失败:', error);
            notification.warning({ 
              message: t('printReceiptSuccessTopUpFailed'),
              description: t('pleaseTopUpMemberManually')
            });
          }
        } else {
          notification.success({ message: t('printReceiptSuccess') });
        }
        
        if (onPrintSuccess) {
          onPrintSuccess();
        } else {
          onBackToList();
        }
      } catch (error) {
        console.error('创建销售订单失败:', error);
        notification.error({ message: t('printReceiptFailed') });
      } finally {
        setSubmitting(false);
      }
    } else {
      notification.error({ message: 'Payment Amount is not equal to Total Price' });
    }
  };

  const addPayment = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    setNewPayment([...newPayment, payment || `New item ${index++}`]);
    setPayment('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const normalizePhone = (phone: string) => (phone || '').trim().replace(/\s+/g, '');

  const applyCustomer = (customer: CustomerData) => {
    form.setFieldsValue({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
    });
  };

  const searchCustomersByPhone = (phone: string) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setCustomerOptions([]);
      return;
    }
    if (phoneSearchTimer.current) clearTimeout(phoneSearchTimer.current);
    phoneSearchTimer.current = setTimeout(async () => {
      try {
        const res = await customerApi.getList({
          phone: normalized,
          searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' },
        });
        if (res.code === 200 && Array.isArray(res.data)) {
          setCustomerOptions(
            res.data.map((c) => ({
              value: c.phone,
              label: `${c.phone} — ${c.name}`,
              customer: c,
            }))
          );
        }
      } catch (e) {
        console.error('customer lookup failed', e);
      }
    }, 300);
  };

  const onCustomerSelect = (value: string, option: { customer?: CustomerData }) => {
    if (option?.customer) {
      applyCustomer(option.customer);
    }
  };

  const onPhoneBlur = async () => {
    const phone = normalizePhone(form.getFieldValue('customerPhone'));
    if (!phone) return;
    
    try {
      const res = await customerApi.fetchByPhone(phone);
      if (res.code === 200 && res.data) {
        applyCustomer(res.data);
      } else {
        form.setFieldsValue({ customerId: undefined });
      }
    } catch (e) {
      console.error('fetch customer by phone failed', e);
    }
  };

  const onReset = useCallback(() => {
    form.setFieldsValue({
      shop: shops[0], 
      cashier: saler[0], 
      item: [], 
      paymentList: [],
      customerId: undefined,
      customerName: undefined,
      customerPhone: undefined,
      remark: undefined,
    });
    setCustomerOptions([]);
  }, [form]);

  const onPackage = useCallback((value: number) => {
    let newPackage: any = {};
    if (value === -1) {
      newPackage = { code: "Alteration", qty: 1, discountPercent: 0, discount: 0 };
    } else if (value === -2) {
      newPackage = { code: "Credit", qty: 1, discountPercent: 0, discount: 0 };
    } else {
      newPackage = { code: "Package" + value, qty: 1, price: value, discountPercent: 0, discount: 0 };
    }
    if (addRef.current) {
      addRef.current(newPackage);
    } else {
      const items = form.getFieldValue('item') || [];
      form.setFieldsValue({ item: [...items, newPackage] });
    }
  }, [form]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 20 }}>
        <Button onClick={onBackToList} icon={<ArrowLeftOutlined />}>{t('backToList')}</Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", width: 900, marginBottom: 20 }}>
        <Button type="primary" onClick={() => onPackage(1200)}>PACKAGE 1200</Button>
        <Button type="primary" onClick={() => onPackage(1800)}>PACKAGE 1800</Button>
        <Button type="primary" onClick={() => onPackage(2800)}>PACKAGE 2800</Button>
        <Button type="primary" onClick={() => onPackage(3800)}>PACKAGE 3800</Button>
        <Button type="primary" onClick={() => onPackage(5000)}>PACKAGE 5000</Button>
        <Button type="primary" onClick={() => onPackage(-1)}>Alteration</Button>
        <Button type="primary" onClick={() => onPackage(-2)}>Credit</Button>
      </div>

      <Form form={form} layout="vertical" initialValues={{
        shop: shops[0], 
        cashier: saler[0]
      }}>
        <section style={{ marginBottom: 10, marginTop: 10 }}>
          {shops.map((item, index) => (
           index>0? <Button 
              key={index}
              type={shop === index ? 'primary' : 'default'} 
              style={{ borderRadius: 20, marginRight: 5, marginBottom: 5 }} 
              onClick={() => { setShops(index); shopRef.current = index; }}
            >
              {item}
            </Button>:<></>
          ))}
        </section>

        <Form.Item name="cashier" label={t('cashier')}>
          <Select style={{ width: 200 }}>
            {saler.map(s => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* 客户电话搜索 */}
        <Form.Item name="customerId" hidden><Input /></Form.Item>
        <div style={{ marginBottom: 8 }}>
          <Form.Item
            name="customerPhone"
            label={t('phoneNumber')}
            style={{ marginBottom: 4 }}
          >
            <AutoComplete
              style={{ width: 400 }}
              options={customerOptions}
              onSearch={searchCustomersByPhone}
              onSelect={onCustomerSelect}
              onBlur={onPhoneBlur}
              onClear={() => {
                setCustomerOptions([]);
              }}
              allowClear
              placeholder={t('customerPhoneLookup')}
            />
          </Form.Item>
          <div style={{ marginTop: 6, marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13, lineHeight: '20px' }}>
            {t('customerPhoneLookup')}
          </div>
        </div>
        <Form.Item name="customerName" label={t('name')} style={{ marginBottom: 24 }}>
          <Input style={{ width: 280 }} placeholder={t('name')} />
        </Form.Item>

        <Form.Item name="remark" label="Remark" style={{ marginBottom: 24 }}>
          <Input.TextArea style={{ width: 400 }} placeholder="Optional remark" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        {/* Items 列表 */}
        <Form.List name="item">
          {(fields, { add, remove }) => {
            addRef.current = add;
            return (
              <>
                <Form.Item>
                  Item：
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    style={{ marginLeft: 8 }}
                  >
                    Add
                  </Button>
                </Form.Item>

                {fields.map(({ key, name, ...restField }) => {
                  const cur = (items && items[name]) || {};
                  const qty = Number(cur.qty ?? 0);
                  const price = Number(cur.price ?? 0);
                  const discountPercent = Number(cur.discountPercent ?? 0);
                  const discount = Number(cur.discount ?? 0);
                  const finalPrice = calcFinalPrice(price, discountPercent, discount, qty);

                  // 当前行的 designId 缓存的 items（按仓库过滤后）
                  const rowItems: any[] = cur._warehouseItems ?? [];
                  // 颜色选项：显示所有颜色（不限制库存），让用户可以选择预订
                  const colorOptions = [...new Set(rowItems.map((i: any) => i.color).filter(Boolean))];
                  const selectedColor = cur.color;
                  // 尺码选项：显示当前颜色下的所有尺码（不限制库存）
                  const sizeOptions = [...new Set(
                    rowItems
                      .filter((i: any) => !selectedColor || i.color === selectedColor)
                      .map((i: any) => i.size)
                      .filter(Boolean)
                  )];

                  // 搜索商品（debounce）
                  const handleCodeSearch = (val: string) => {
                    if (codeSearchTimers.current[name]) clearTimeout(codeSearchTimers.current[name]);
                    if (!val || val.length < 1) return;
                    codeSearchTimers.current[name] = setTimeout(async () => {
                      try {
                        const res = await designService.getList({
                          design: val, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' }
                        });
                        const list = res?.data?.content ?? [];
                        const currentItems = form.getFieldValue('item') || [];
                        currentItems[name] = { ...currentItems[name], _codeOptions: list };
                        form.setFieldsValue({ item: [...currentItems] });
                      } catch { /* ignore */ }
                    }, 350);
                  };

                  // 选中某个商品
                  const handleCodeSelect = async (val: string, option: any) => {
                    const designId = option.designId;
                    const salePrice = option.salePrice;
                    // 查询所有门店的库存（不再按 warehouseName 过滤）
                    try {
                      const res = await itemApi.getList({ designId, searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
                      const warehouseItems = res?.data ?? [];
                      // 只考慮有庫存的記錄來決定預設顏色/尺碼
                      const inStockItems = warehouseItems.filter((i: any) => (i.inStoreStock ?? 0) > 0);
                      const firstColor = inStockItems[0]?.color ?? warehouseItems[0]?.color ?? '';
                      const firstSize = inStockItems.find((i: any) => i.color === firstColor)?.size ?? warehouseItems.find((i: any) => i.color === firstColor)?.size ?? '';
                      const firstItemId = warehouseItems.find((i: any) => i.color === firstColor && i.size === firstSize)?.id ?? null;
                      const currentItems = form.getFieldValue('item') || [];
                      currentItems[name] = {
                        ...currentItems[name],
                        code: val,
                        price: parseFloat(salePrice ?? 0),
                        color: firstColor,
                        size: firstSize,
                        itemId: firstItemId,
                        _warehouseItems: warehouseItems,
                        _codeOptions: [],
                      };
                      form.setFieldsValue({ item: [...currentItems] });
                    } catch {
                      notification.error({ message: t('fetchStockFailed') });
                    }
                  };

                  // 颜色改变时重置尺码，并更新 itemId
                  const handleColorChange = (val: string) => {
                    const currentItems = form.getFieldValue('item') || [];
                    const matched = rowItems.find((i: any) => i.color === val);
                    const newSize = matched?.size ?? '';
                    const newItemId = matched?.id ?? null;
                    currentItems[name] = { ...currentItems[name], color: val, size: newSize, itemId: newItemId };
                    form.setFieldsValue({ item: [...currentItems] });
                  };

                  const codeOptions = (cur._codeOptions ?? []).map((d: any) => ({
                    value: d.design,
                    label: `${d.design}  $${d.salePrice}`,
                    designId: d.id,
                    salePrice: d.salePrice,
                  }));

                  return (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'code']}
                        rules={[{ required: true, message: 'Missing code' }]}
                      >
                        <AutoComplete
                          style={{ width: 180 }}
                          placeholder="Code"
                          options={codeOptions}
                          onSearch={handleCodeSearch}
                          onSelect={handleCodeSelect}
                          filterOption={false}
                          allowClear
                          onChange={(val) => {
                            // 清空时重置颜色/尺码/价格/库存缓存
                            if (!val) {
                              const currentItems = form.getFieldValue('item') || [];
                              currentItems[name] = { ...currentItems[name], code: '', price: undefined, color: undefined, size: undefined, _warehouseItems: [], _codeOptions: [] };
                              form.setFieldsValue({ item: [...currentItems] });
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'color']}>
                        <Select
                          placeholder="Color"
                          style={{ width: 120 }}
                          options={colorOptions.map(c => ({ value: c, label: c }))}
                          onChange={handleColorChange}
                          allowClear
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'size']}>
                        <Select
                          placeholder="Size"
                          style={{ width: 100 }}
                          options={sizeOptions.map(s => ({ value: s, label: s }))}
                          allowClear
                          onChange={(val: string) => {
                            const currentItems = form.getFieldValue('item') || [];
                            const matched = rowItems.find((i: any) => i.color === cur.color && i.size === val);
                            currentItems[name] = { ...currentItems[name], size: val, itemId: matched?.id ?? null };
                            form.setFieldsValue({ item: [...currentItems] });
                          }}
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'stockType']} initialValue="inStock" noStyle>
                        <Input type="hidden" />
                      </Form.Item>
                      <Button
                        size="small"
                        type={cur.stockType === 'order' ? 'default' : 'primary'}
                        style={{ 
                          width: 80,
                          background: cur.stockType === 'order' ? '#faad14' : undefined,
                          borderColor: cur.stockType === 'order' ? '#faad14' : undefined,
                          color: cur.stockType === 'order' ? '#fff' : undefined,
                        }}
                        onClick={() => {
                          const currentItems = form.getFieldValue('item') || [];
                          const next = cur.stockType === 'order' ? 'inStock' : 'order';
                          currentItems[name] = { ...currentItems[name], stockType: next };
                          form.setFieldsValue({ item: [...currentItems] });
                        }}
                      >
                        {cur.stockType === 'order' ? 'Order' : 'In Stock'}
                      </Button>
                      <Form.Item {...restField} name={[name, 'qty']} initialValue={1}>
                        <InputNumber placeholder="Qty" min={0} style={{ width: 60 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'price']}>
                        <InputNumber placeholder="Price" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'discountPercent']} initialValue={0}>
                        <InputNumber placeholder="Discount/%" min={0} max={100} style={{ width: 100 }} />
                      </Form.Item>
                      <span>(%)</span>
                      <Form.Item {...restField} name={[name, 'discount']} initialValue={0}>
                        <InputNumber placeholder="Discount/Number" min={0} style={{ width: 100 }} />
                      </Form.Item>
                      <span>(Number)</span>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Final: {finalPrice}</div>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                    </Space>
                  );
                })}
              </>
            );
          }}
        </Form.List>

        {/* 🔹 总价显示 */}
        <Form.Item label="Total Price">
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>
            {totalPrice.toFixed(2)}
          </div>
        </Form.Item>

        {/* Payment 列表 */}
        <Form.List name="paymentList">
          {(fields, { add, remove }) => (
            <>
              <Form.Item>
                {t('paymentMethod')}：
                <Button 
                  type="dashed" 
                  onClick={() => {
                    const { item, paymentList } = form.getFieldsValue();
                    if (item) {
                      const price = item.reduce((prev: number, current: any) => {
                        const { price, discount, discountPercent, qty } = current;
                        return prev + calcFinalPrice(price, discountPercent, discount, qty);
                      }, 0);
                      const pay = (paymentList || []).reduce((prev: number, current: any) => {
                        const { amount } = current;
                        return prev + amount;
                      }, 0);
                      add({ payment: '', amount: (price - pay).toFixed(2) });
                    } else {
                      notification.error({ message: "Please add Item before payment" });
                    }
                  }} 
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 8 }}
                >{t('addPaymentMethod')}</Button>
              </Form.Item>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'payment']}
                    rules={[{ required: true, message: 'Missing payment' }]}
                  >
                    <Select
                      style={{ width: 300 }}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Space style={{ padding: '0 8px 4px' }}>
                            <Input
                              placeholder={t('pleaseEnterPaymentMethod')}
                              ref={inputRef}
                              value={payment}
                              onChange={(e) => setPayment(e.target.value)}
                            />
                            <Button type="text" icon={<PlusOutlined />} onClick={addPayment}>{t('addPaymentMethod')}</Button>
                          </Space>
                        </>
                      )}
                      options={newPayment.map((item) => ({ label: item, value: item }))}
                    />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'amount']}>
                    <InputNumber placeholder="Amount" min={0} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                </Space>
              ))}
            </>
          )}
        </Form.List>
      </Form>

      <div style={{ marginTop: 20 }}>
        <Button type="primary" style={{ marginRight: 20 }} onClick={onFinish} loading={submitting} disabled={submitting}>{t('printReceipt')}</Button>
        <Button onClick={onReset}>{t('reset')}</Button>
      </div>
    </div>
  );
}
