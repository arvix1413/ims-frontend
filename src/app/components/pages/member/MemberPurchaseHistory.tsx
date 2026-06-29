'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Pagination, Space, Tag, Row, Drawer, Form, Input, InputNumber, DatePicker, notification, Modal } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MemberData, MemberPurchaseRecord, MemberPurchaseRequest, CreatePurchaseRecordRequest } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { member } from '@/lib/api';
import { designService } from '@/lib/api';
import moment from 'moment';

interface MemberPurchaseHistoryProps {
  memberData: MemberData;
  onBackToList: () => void;
}

export default function MemberPurchaseHistory({ memberData, onBackToList }: MemberPurchaseHistoryProps) {
  const { t } = useTranslation();
  const { canUseFeature, isAdmin } = usePermissions();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<MemberPurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [refundDrawerVisible, setRefundDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MemberPurchaseRecord | null>(null);

  // 获取购买记录
  const fetchPurchaseHistory = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    setData([]);
    
    try {
      const formValues = searchForm.getFieldsValue();
      
      const params: MemberPurchaseRequest = {
        memberId: memberData.id,
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'create_date'
        },
        ...formValues,
        ...searchParams
      };

      const response = await member.getPurchaseHistory(params);
      if (response.code === 200) {
        setData(response.data.content);
        setPagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      } else {
        setData([]);
        setPagination({
          current: 1,
          pageSize: 20,
          total: 0,
        });
      }
    } catch (error) {
      console.error('获取购买记录失败:', error);
      message.error(t('fetchPurchaseRecordsFailed'));
      setData([]);
      setPagination({
        current: 1,
        pageSize: 20,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchPurchaseHistory();
  }, [memberData.id]);

  // 搜索
  const handleSearch = () => {
    fetchPurchaseHistory(1);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchPurchaseHistory(1);
  };

  // 分页变化
  const handleTableChange = (page: number) => {
    fetchPurchaseHistory(page);
  };

  // {t('add')}购买记录
  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      subscription: [1]
    });
    setCreateDrawerVisible(true);
  };

  // 提交{t('add')}购买记录
  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 计算总金额
      const sum = values.designs.reduce((total: number, item: any) => {
        return total + (item.price || 0);
      }, 0);

      const params: CreatePurchaseRecordRequest = {
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        designs: values.designs,
        saler: values.saler,
        remark: values.remark,
        memberId: memberData.id,
        sum: sum.toFixed(2),
      };

      await member.createPurchaseRecord(params);
      message.success(t('createPurchaseRecordSuccess'));
      setCreateDrawerVisible(false);
      fetchPurchaseHistory(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        notification.error({
          message: t('pleaseFillComplete'),
          description: t('pleaseCheckRequiredFields'),
        });
      } else {
        console.error('新增购买记录失败:', error);
        message.error(t('createPurchaseRecordFailed'));
      }
    }
  };

  // 退还
  const handleRefund = () => {
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      subscription: [1]
    });
    setRefundDrawerVisible(true);
  };

  // 提交退还
  const handleRefundSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 计算总金额（负数）
      const sum = values.designs.reduce((total: number, item: any) => {
        return total + (item.price || 0);
      }, 0);

      const params: CreatePurchaseRecordRequest = {
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        designs: values.designs,
        saler: values.saler,
        remark: values.remark,
        memberId: memberData.id,
        sum: (-sum).toFixed(2), // 负数
      };

      await member.createPurchaseRecord(params);
      message.success(t('refundSuccess'));
      setRefundDrawerVisible(false);
      fetchPurchaseHistory(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        notification.error({
          message: t('pleaseFillComplete'),
          description: t('pleaseCheckRequiredFields'),
        });
      } else {
        console.error('退还失败:', error);
        message.error(t('refundFailed'));
      }
    }
  };

  // {t('delete')}购买记录
  const handleDelete = (record: MemberPurchaseRecord) => {
    setSelectedRecord(record);
    setDeleteModalVisible(true);
  };

  // {t('confirm')}{t('delete')}
  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;
    
    try {
      await member.deletePurchaseRecord([selectedRecord.id]);
      message.success(t('deletePurchaseRecordSuccess'));
      setDeleteModalVisible(false);
      fetchPurchaseHistory(pagination.current);
    } catch (error) {
      console.error('删除购买记录失败:', error);
      message.error(t('deletePurchaseRecordFailed'));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: t('purchaseDate'),
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
    },
    {
      title: '商品',
      dataIndex: 'designList',
      key: 'designList',
      width: 350,
      render: (value: any) => {
        if (!Array.isArray(value) || value.length === 0) return <span>-</span>;

        return (
          <Space wrap>
            {value.map((item, idx) => (
              <Tag key={idx} color="blue">
                {item?.designCode} - ${item?.price}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: t('saler'),
      dataIndex: 'saler',
      key: 'saler',
      width: 100,
    },
    {
      title: t('totalAmount'),
      dataIndex: 'sum',
      key: 'sum',
      width: 100,
      render: (sum: number) => (
        <div style={{ fontWeight: 'bold', color: '#262626' }}>
          ${sum}
        </div>
      ),
    },
    {
      title: t('memberBalance'),
      dataIndex: 'memberRemainingAmount',
      key: 'memberRemainingAmount',
      width: 120,
      render: (amount: number) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
          ${amount}
        </div>
      ),
    },
    {
      title: '支付详情/退款原因',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
    },
    ...(canUseFeature('deletePurchaseRecord') ? [{
      title: t('operation'),
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: MemberPurchaseRecord) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
          {t('delete')}
        </Button>
      ),
    }] : []),
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBackToList}
            style={{ marginRight: 16 }}
          >
            返回列表
          </Button>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>会员购买记录</h2>
        </div>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginRight: 8 }}>
            {t('add')}
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={handleRefund}>
            退还
          </Button>
        </div>
      </div>

      {/* 会员详细信息 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: 16 }}>
          <Row style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Name 贵名：</span>
            <span>{memberData?.name}</span>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Phone 手机号码：</span>
            <span>{memberData?.phone}</span>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Date 日期：</span>
            <span>{memberData?.registrationDate}</span>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Voucher Number 编号：</span>
            <span>{memberData?.voucherNumber}</span>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Member Package Total Amount 会员配套总额：</span>
            <span>${memberData?.membershipPackageTotal}</span>
          </Row>
          {memberData?.height && (
            <Row style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Height 身高：</span>
              <span>{memberData.height} cm</span>
            </Row>
          )}
          {memberData?.weight && (
            <Row style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Weight 体重：</span>
              <span>{memberData.weight} kg</span>
            </Row>
          )}
          {memberData?.size && (
            <Row style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Size 尺码：</span>
              <span>{memberData.size}</span>
            </Row>
          )}
          {memberData?.personalNotes && (
            <Row style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Personal Notes 个人备注及喜好：</span>
              <span>{memberData.personalNotes}</span>
            </Row>
          )}
          <Row>
            <span style={{ fontWeight: 'bold', marginRight: 8, minWidth: 200 }}>Remark 备注：</span>
            <span>{memberData?.remark}</span>
          </Row>
        </div>
      </Card>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="designCode" label={t('designCode') || '商品代码'}>
            <Input placeholder={t('pleaseEnterDesignCode') || '请输入商品代码'} style={{ width: 200 }} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('search')}
              </Button>
              <Button onClick={handleReset}>
                {t('reset')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 购买记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />
        
        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }
          />
        </div>
      </Card>

      {/* {t('add')}购买记录抽屉 */}
      <Drawer
        title={t('add')+'购买记录'}
        open={createDrawerVisible}
        onClose={() => setCreateDrawerVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, subscription: [1] }}>
          <Form.Item name="purchaseDate" label="购买日期" rules={[{ required: true, message: '请选择购买日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.List name="designs">
            {(fields, { add, remove }) => (
              <>
                <Form.Item>
                  商品：
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginLeft: 8 }}>
                    添加商品
                  </Button>
                </Form.Item>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'designCode']}
                      rules={[{ required: true, message: '请输入商品代码' }]}
                    >
                      <Input
                        placeholder="商品代码"
                        style={{ width: 180 }}
                        onBlur={async (e) => {
                          const code = e.target.value;
                          if (!code) return;
                          try {
                            const res = await designService.getDesignDetail({ design: code });
                            if (res.code === 200 && res.data?.length > 0) {
                              const d = res.data[0];
                              const designs = form.getFieldValue('designs') || [];
                              designs[name] = { ...designs[name], price: parseFloat(d.salePrice ?? 0), color: d.color?.[0] ?? '', size: d.size?.[0] ?? '' };
                              form.setFieldsValue({ designs: [...designs] });
                              notification.success({ message: `已匹配：${d.design}，售价 $${d.salePrice}` });
                            } else {
                              notification.warning({ message: '未找到对应商品' });
                            }
                          } catch { notification.error({ message: '查询失败' }); }
                        }}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'color']}>
                      <Input placeholder="颜色" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'size']}>
                      <Input placeholder="尺码" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      rules={[{ required: true, message: '请输入价格' }]}
                    >
                      <InputNumber placeholder="价格" min={0} style={{ width: 140 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                  </Space>
                ))}
              </>
            )}
          </Form.List>
          
          <Form.Item name="saler" label="销售员" rules={[{ required: true, message: '请输入销售员' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="支付详情" rules={[{ required: true, message: '请输入支付详情' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleCreateSubmit} block>
              {t('confirm')}{t('add')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 退还抽屉 */}
      <Drawer
        title="退还"
        open={refundDrawerVisible}
        onClose={() => setRefundDrawerVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, subscription: [1] }}>
          <Form.Item name="purchaseDate" label="购买日期" rules={[{ required: true, message: '请选择购买日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.List name="designs">
            {(fields, { add, remove }) => (
              <>
                <Form.Item>
                  商品：
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginLeft: 8 }}>
                    添加商品
                  </Button>
                </Form.Item>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'designCode']}
                      rules={[{ required: true, message: '请输入商品代码' }]}
                    >
                      <Input
                        placeholder="商品代码"
                        style={{ width: 180 }}
                        onBlur={async (e) => {
                          const code = e.target.value;
                          if (!code) return;
                          try {
                            const res = await designService.getDesignDetail({ design: code });
                            if (res.code === 200 && res.data?.length > 0) {
                              const d = res.data[0];
                              const designs = form.getFieldValue('designs') || [];
                              designs[name] = { ...designs[name], price: parseFloat(d.salePrice ?? 0), color: d.color?.[0] ?? '', size: d.size?.[0] ?? '' };
                              form.setFieldsValue({ designs: [...designs] });
                              notification.success({ message: `已匹配：${d.design}，售价 $${d.salePrice}` });
                            } else {
                              notification.warning({ message: '未找到对应商品' });
                            }
                          } catch { notification.error({ message: '查询失败' }); }
                        }}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'color']}>
                      <Input placeholder="颜色" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'size']}>
                      <Input placeholder="尺码" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      rules={[{ required: true, message: '请输入价格' }]}
                    >
                      <InputNumber placeholder="价格" min={0} style={{ width: 140 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                  </Space>
                ))}
              </>
            )}
          </Form.List>
          
          <Form.Item name="saler" label="销售员" rules={[{ required: true, message: '请输入销售员' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="支付详情" rules={[{ required: true, message: '请输入支付详情' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleRefundSubmit} block>
              {t('confirm')}退还
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* {t('delete')}{t('confirm')}弹窗 */}
      <Modal
        title="{t('delete')}{t('confirm')}"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText="{t('confirm')}{t('delete')}"
        cancelText="{t('cancel')}"
        okButtonProps={{ danger: true }}
      >
        <p>确定要{t('delete')}这条购买记录吗？此操作不可撤销。</p>
      </Modal>
    </div>
  );
}
