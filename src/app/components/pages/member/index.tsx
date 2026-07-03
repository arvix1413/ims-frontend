'use client';

import React, { useState, useEffect } from 'react';
import { Table, Form, Input, Button, Card, message, Pagination, Modal, Drawer, InputNumber, DatePicker, notification, Space, Tag, Row, Dropdown, Menu } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, MoreOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MemberData, MemberListRequest, ModifyMemberRequest, TopUpMemberRequest, MemberPurchaseRecord, MemberPurchaseRequest, CreateMemberRequest } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { useIsMobile } from '@/lib/useIsMobile';
import { member } from '@/lib/api';
import moment from 'moment';
import MemberPurchaseHistory from './MemberPurchaseHistory';
import AllMemberPurchaseHistory from './AllMemberPurchaseHistory';
import MemberTopUpHistory from './MemberTopUpHistory';
import { useInitialListRefresh } from '@/lib/useListRefresh';

const MEMBER_PAGE_SIZE = 20;

export default function MemberManagement() {
  const { t } = useTranslation();
  const { canUseFeature, isAdmin } = usePermissions();
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const [modifyForm] = Form.useForm();
  const [topUpForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [data, setData] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: MEMBER_PAGE_SIZE,
    total: 0,
  });
  const [modifyDrawerVisible, setModifyDrawerVisible] = useState(false);
  const [topUpDrawerVisible, setTopUpDrawerVisible] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'purchase' | 'allPurchase' | 'topUp'>('list');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // 获取数据
  const fetchData = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    setData([]);
    
    try {
      const formValues = form.getFieldsValue();
      
      // Format dates to YYYY-MM-DD
      if (formValues.startDate) {
        formValues.startDate = formValues.startDate.format('YYYY-MM-DD');
      }
      if (formValues.endDate) {
        formValues.endDate = formValues.endDate.format('YYYY-MM-DD');
      }
      
      const params: MemberListRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: MEMBER_PAGE_SIZE,
          sort: 'voucherNumber'
        },
        ...formValues,
        ...searchParams
      };

      const response = await member.getPage(params);
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
      console.error('获取会员数据失败:', error);
      message.error(t('fetchMemberDataFailed'));
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

  useInitialListRefresh(() => fetchData(1));

  // 处理行选择变化
  const handleRowSelectionChange = (selectedKeys: React.Key[], selectedRows: MemberData[]) => {
    setSelectedRowKeys(selectedKeys);
    const total = selectedRows.reduce((sum, row) => sum + (row.balance || 0), 0);
    setTotalBalance(total);
  };

  // 搜索
  const handleSearch = () => {
    fetchData(1);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    fetchData(1);
  };

  // 分页变化
  const handleTableChange = (page: number) => {
    fetchData(page);
  };

  // 修改会员
  const handleModify = (record: MemberData) => {
    setSelectedMember(record);
    modifyForm.setFieldsValue({
      name: record.name,
      phone: record.phone,
      registrationDate: moment(record.registrationDate, 'YYYY-MM-DD'),
      voucherNumber: record.voucherNumber,
      remark: record.remark,
      height: record.height,
      weight: record.weight,
      size: record.size,
      personalNotes: record.personalNotes,
    });
    setModifyDrawerVisible(true);
  };

  // 提交修改
  const handleModifySubmit = async () => {
    try {
      const values = await modifyForm.validateFields();
      if (!selectedMember) return;

      const params: ModifyMemberRequest = {
        id: selectedMember.id,
        name: values.name,
        phone: values.phone,
        registrationDate: values.registrationDate.format('YYYY-MM-DD'),
        voucherNumber: values.voucherNumber,
        remark: values.remark,
        height: values.height,
        weight: values.weight,
        size: values.size,
        personalNotes: values.personalNotes,
      };

      await member.modify(params);
      message.success(t('modifyMemberSuccess'));
      setModifyDrawerVisible(false);
      fetchData(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        notification.error({
          message: t('pleaseFillComplete'),
          description: t('pleaseCheckRequiredFields'),
        });
      } else {
        console.error('修改会员信息失败:', error);
        message.error(t('modifyMemberFailed'));
      }
    }
  };

  // 充值
  const handleTopUp = (record: MemberData) => {
    setSelectedMember(record);
    topUpForm.resetFields();
    setTopUpDrawerVisible(true);
  };

  // 提交充值
  const handleTopUpSubmit = async () => {
    try {
      const values = await topUpForm.validateFields();
      if (!selectedMember) return;

      const params: TopUpMemberRequest = {
        id: selectedMember.id,
        saler: values.saler,
        balance: values.amount,
        remark: values.remark,
      };

      await member.topUp(params);
      message.success(t('topUpSuccess'));
      setTopUpDrawerVisible(false);
      fetchData(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        notification.error({
          message: t('pleaseFillComplete'),
          description: t('pleaseCheckRequiredFields'),
        });
      } else {
        console.error('充值失败:', error);
        message.error(t('topUpFailed'));
      }
    }
  };

  // 删除
  const handleDelete = (record: MemberData) => {
    setSelectedMember(record);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    
    try {
      await member.delete([selectedMember.id]);
      message.success(t('deleteMemberSuccess'));
      setDeleteModalVisible(false);
      fetchData(pagination.current);
    } catch (error) {
      console.error('删除会员失败:', error);
      message.error(t('deleteMemberFailed'));
    }
  };

  // 查看购买记录
  const handleViewPurchase = (record: MemberData) => {
    setSelectedMember(record);
    setCurrentView('purchase');
  };

  // 返回列表
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedMember(null);
    fetchData(pagination.current);
  };

  // 查看所有会员购买记录
  const handleViewAllPurchase = () => {
    setCurrentView('allPurchase');
  };

  // 查看会员充值记录
  const handleViewTopUp = () => {
    setCurrentView('topUp');
  };

  // 新增会员
  const handleCreate = () => {
    createForm.resetFields();
    setCreateDrawerVisible(true);
  };

  // 提交新增会员
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();

      const params: CreateMemberRequest = {
        name: values.name,
        phone: values.phone,
        registrationDate: values.registrationDate.format('YYYY-MM-DD'),
        voucherNumber: values.voucherNumber,
        remark: values.remark,
        balance: 0,
        membershipPackageTotal: 0,
        height: values.height,
        weight: values.weight,
        size: values.size,
        personalNotes: values.personalNotes,
      };

      await member.create(params);
      message.success(t('createMemberSuccess'));
      setCreateDrawerVisible(false);
      fetchData(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        notification.error({
          message: t('pleaseFillComplete'),
          description: t('pleaseCheckRequiredFields'),
        });
      } else {
        console.error('新增会员失败:', error);
        message.error(t('createMemberFailed'));
      }
    }
  };

  const handleMobileSearch = () => {
    const keyword = searchText.trim();
    if (!keyword) {
      fetchData(1);
      return;
    }
    if (/^\d/.test(keyword)) {
      fetchData(1, { phone: keyword });
    } else {
      fetchData(1, { name: keyword });
    }
  };

  // 渲染会员卡片（移动端）
  const renderMemberCard = (memberData: MemberData) => {
    const menuItems = [
      {
        key: 'detail',
        icon: <EyeOutlined />,
        label: t('detailRecord'),
        onClick: () => handleViewPurchase(memberData),
      },
      {
        key: 'modify',
        icon: <EditOutlined />,
        label: t('modify'),
        onClick: () => handleModify(memberData),
      },
      {
        key: 'topUp',
        icon: <DollarOutlined />,
        label: t('topUp'),
        onClick: () => handleTopUp(memberData),
      },
      ...(canUseFeature('deleteMember') ? [
      
        {
          key: 'divider',
          type: 'divider' as const,
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: t('delete'),
          danger: true,
          onClick: () => handleDelete(memberData),
        }
      ] : []),
    ];

    return (
      <Card size="small" className="shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-semibold text-gray-800">{memberData.name}</span>
              <Tag color="blue">${memberData.balance}</Tag>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📱 {memberData.phone}</div>
              <div>🎫 {t('voucherNumber')}: {memberData.voucherNumber}</div>
              {memberData.height && <div>📏 {t('height')}: {memberData.height}cm</div>}
              {memberData.weight && <div>⚖️ {t('weight')}: {memberData.weight}kg</div>}
              {memberData.size && <div>👕 {t('size')}: {memberData.size}</div>}
              {memberData.personalNotes && (
                <div className="text-xs bg-blue-50 p-2 rounded mt-2">
                  💡 {memberData.personalNotes}
                </div>
              )}
              <div className="text-xs text-gray-400">
                {moment(memberData.registrationDate).format('YYYY-MM-DD')}
              </div>
            </div>
          </div>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </Card>
    );
  };

  // 表格列定义（桌面端）
  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: t('voucherNumber'),
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 100,
    },
    {
      title: t('registrationDate'),
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 120,
      render: (value: string) => moment(value).format('YYYY-MM-DD'),
    },
    {
      title: t('memberBalance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => (
        <div style={{ fontWeight: 'bold', color: '#262626' }}>
          ${balance}
        </div>
      ),
    },
    {
      title: t('operation'),
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: MemberData) => {
        const menuItems = [
          <Menu.Item key="modify" icon={<EditOutlined />} onClick={() => handleModify(record)}>
            {t('modify')}
          </Menu.Item>,
          <Menu.Item key="topUp" icon={<PlusOutlined />} onClick={() => handleTopUp(record)}>
            {t('topUp')}
          </Menu.Item>,
          <Menu.Item key="detail" icon={<EyeOutlined />} onClick={() => handleViewPurchase(record)}>
            {t('detailRecord')}
          </Menu.Item>,
        ];

        // 只有有删除权限的用户才能看到删除选项
        if (canUseFeature('deleteMember')) {
          menuItems.push(
            <Menu.Divider key="divider" />,
            <Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              {t('delete')}
            </Menu.Item>
          );
        }

        const menu = <Menu>{menuItems}</Menu>;

        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button type="link" icon={<MoreOutlined />}>
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  if (currentView === 'purchase' && selectedMember) {
    return (
      <MemberPurchaseHistory
        memberData={selectedMember}
        onBackToList={handleBackToList}
      />
    );
  }

  if (currentView === 'allPurchase') {
    return (
      <AllMemberPurchaseHistory onBackToList={handleBackToList} />
    );
  }

  if (currentView === 'topUp') {
    return (
      <MemberTopUpHistory onBackToList={handleBackToList} />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* 桌面端视图 */}
      <div className="hidden md:block">
        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <Button icon={<EyeOutlined />} onClick={handleViewAllPurchase} style={{ marginRight: 8 }}>
              {t('memberPurchaseHistory')}
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleViewTopUp} style={{ marginRight: 8 }}>
              {t('memberTopUpHistory')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('addMember')}
            </Button>
          </div>
        </div>
        
        {/* 搜索表单 */}
        <Card style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
          >
            <Form.Item name="name" label={t('name')}>
              <Input placeholder={t('pleaseEnterName')} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="phone" label={t('phone')}>
              <Input placeholder={t('pleaseEnterPhone')} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="startDate" label={t('startDate')}>
              <DatePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="endDate" label={t('endDate')}>
              <DatePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                {t('search')}
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                {t('reset')}
              </Button>
            </Form.Item>
            {isAdmin() && (
              <Form.Item>
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                  {t('选中会员总余额')}: ${totalBalance}
                </span>
              </Form.Item>
            )}
          </Form>
        </Card>

        {/* 数据表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: "100%" }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: handleRowSelectionChange,
            }}
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
      </div>

      {/* 移动端视图 */}
      <div className="md:hidden pb-20">
        {/* 搜索和新增 */}
        <div className="mb-4 space-y-3">
          <Input.Search
            placeholder={t('searchNameOrPhone')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleMobileSearch}
            size="large"
            allowClear
            enterButton
          />
          <Button
            type="primary"
            block
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('addMember')}
          </Button>
        </div>

        {/* 会员列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">{t('loading')}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('noMembers')}</div>
          ) : (
            data.map((memberData) => (
              <div key={memberData.id}>
                {renderMemberCard(memberData)}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }
            size="small"
          />
        </div>
      </div>

      {/* 桌面端修改会员抽屉 */}
      {!isMobile && (
        <Drawer
          title={t('modifyMemberInfo')}
          open={modifyDrawerVisible}
          onClose={() => setModifyDrawerVisible(false)}
          width={600}
          placement="right"
        >
          <Form form={modifyForm} layout="vertical">
            <Form.Item name="name" label={t('name')} rules={[{ required: true, message: t('pleaseEnterName') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={t('phone')} rules={[{ required: true, message: t('pleaseEnterPhone') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="registrationDate" label={t('registrationDate')} rules={[{ required: true, message: t('pleaseSelectRegistrationDate') }]}>
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                placeholder={t('pleaseSelectRegistrationDate')}
              />
            </Form.Item>
            <Form.Item name="voucherNumber" label={t('voucherNumber')} rules={[{ required: true, message: t('pleaseEnterVoucherNumber') }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height" label={t('height') + ' (cm)'}>
              <InputNumber style={{ width: '100%' }} min={0} max={300} placeholder={t('pleaseEnterHeight')} />
            </Form.Item>
            <Form.Item name="weight" label={t('weight') + ' (kg)'}>
              <InputNumber style={{ width: '100%' }} min={0} max={500} step={0.1} placeholder={t('pleaseEnterWeight')} />
            </Form.Item>
            <Form.Item name="size" label={t('size')}>
              <Input placeholder={t('pleaseEnterSize')} />
            </Form.Item>
            <Form.Item name="personalNotes" label={t('personalNotes')}>
              <Input.TextArea rows={4} placeholder={t('pleaseEnterPersonalNotes')} />
            </Form.Item>
            <Form.Item name="remark" label={t('remark')}>
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleModifySubmit} block>
                {t('confirmModify')}
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 移动端修改会员抽屉 */}
      {isMobile && (
        <Drawer
          title={t('modifyMemberInfo')}
          open={modifyDrawerVisible}
          onClose={() => setModifyDrawerVisible(false)}
          placement="bottom"
          height="80%"
        >
          <Form form={modifyForm} layout="vertical" onFinish={handleModifySubmit}>
            <Form.Item name="name" label={t('name')} rules={[{ required: true, message: t('pleaseEnterName') }]}>
              <Input size="large" placeholder={t('pleaseEnterName')} />
            </Form.Item>
            <Form.Item name="phone" label={t('phone')} rules={[{ required: true, message: t('pleaseEnterPhone') }]}>
              <Input size="large" placeholder={t('pleaseEnterPhone')} />
            </Form.Item>
            <Form.Item name="registrationDate" label={t('registrationDate')} rules={[{ required: true, message: t('pleaseSelectRegistrationDate') }]}>
              <DatePicker 
                size="large"
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                placeholder={t('pleaseSelectRegistrationDate')}
              />
            </Form.Item>
            <Form.Item name="voucherNumber" label={t('voucherNumber')} rules={[{ required: true, message: t('pleaseEnterVoucherNumber') }]}>
              <InputNumber size="large" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height" label={t('height') + ' (cm)'}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} max={300} placeholder={t('pleaseEnterHeight')} />
            </Form.Item>
            <Form.Item name="weight" label={t('weight') + ' (kg)'}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} max={500} step={0.1} placeholder={t('pleaseEnterWeight')} />
            </Form.Item>
            <Form.Item name="size" label={t('size')}>
              <Input size="large" placeholder={t('pleaseEnterSize')} />
            </Form.Item>
            <Form.Item name="personalNotes" label={t('personalNotes')}>
              <Input.TextArea size="large" rows={4} placeholder={t('pleaseEnterPersonalNotes')} />
            </Form.Item>
            <Form.Item name="remark" label={t('remark')}>
              <Input size="large" placeholder={t('remark')} />
            </Form.Item>
            <div className="flex gap-3 mt-6">
              <Button block size="large" onClick={() => setModifyDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block size="large" htmlType="submit">
                {t('confirm')}
              </Button>
            </div>
          </Form>
        </Drawer>
      )}

      {/* 桌面端充值抽屉 */}
      {!isMobile && (
        <Drawer
          title={t('memberTopUp')}
          open={topUpDrawerVisible}
          onClose={() => setTopUpDrawerVisible(false)}
          width={600}
          placement="right"
        >
          <Form form={topUpForm} layout="vertical">
            <Form.Item name="amount" label={t('memberAmount')} rules={[{ required: true, message: t('pleaseEnterTopUpAmount') }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="saler" label={t('saler')} rules={[{ required: true, message: t('pleaseEnterSaler') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="remark" label={t('paymentDetail')} rules={[{ required: true, message: t('pleaseEnterPaymentDetail') }]}>
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleTopUpSubmit} block>
                {t('confirmTopUp')}
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 移动端充值抽屉 */}
      {isMobile && (
        <Drawer
          title={t('memberTopUp')}
          open={topUpDrawerVisible}
          onClose={() => setTopUpDrawerVisible(false)}
          placement="bottom"
          height="70%"
        >
          <Form form={topUpForm} layout="vertical" onFinish={handleTopUpSubmit}>
            <Form.Item name="amount" label={t('memberAmount')} rules={[{ required: true, message: t('pleaseEnterTopUpAmount') }]}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="saler" label={t('saler')} rules={[{ required: true, message: t('pleaseEnterSaler') }]}>
              <Input size="large" placeholder={t('pleaseEnterSaler')} />
            </Form.Item>
            <Form.Item name="remark" label={t('paymentDetail')} rules={[{ required: true, message: t('pleaseEnterPaymentDetail') }]}>
              <Input size="large" placeholder={t('pleaseEnterPaymentDetail')} />
            </Form.Item>
            <div className="flex gap-3 mt-6">
              <Button block size="large" onClick={() => setTopUpDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block size="large" htmlType="submit">
                {t('confirm')}
              </Button>
            </div>
          </Form>
        </Drawer>
      )}

      {/* 桌面端新增会员抽屉 */}
      {!isMobile && (
        <Drawer
          title={t('addMember')}
          open={createDrawerVisible}
          onClose={() => setCreateDrawerVisible(false)}
          width={600}
          placement="right"
        >
          <Form form={createForm} layout="vertical">
            <Form.Item name="name" label={t('name')} rules={[{ required: true, message: t('pleaseEnterName') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={t('phone')} rules={[{ required: true, message: t('pleaseEnterPhone') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="registrationDate" label={t('registrationDate')} rules={[{ required: true, message: t('pleaseSelectRegistrationDate') }]}>
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                placeholder={t('pleaseSelectRegistrationDate')}
              />
            </Form.Item>
            <Form.Item name="voucherNumber" label={t('voucherNumber')} rules={[{ required: true, message: t('pleaseEnterVoucherNumber') }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height" label={t('height') + ' (cm)'}>
              <InputNumber style={{ width: '100%' }} min={0} max={300} placeholder={t('pleaseEnterHeight')} />
            </Form.Item>
            <Form.Item name="weight" label={t('weight') + ' (kg)'}>
              <InputNumber style={{ width: '100%' }} min={0} max={500} step={0.1} placeholder={t('pleaseEnterWeight')} />
            </Form.Item>
            <Form.Item name="size" label={t('size')}>
              <Input placeholder={t('pleaseEnterSize')} />
            </Form.Item>
            <Form.Item name="personalNotes" label={t('personalNotes')}>
              <Input.TextArea rows={4} placeholder={t('pleaseEnterPersonalNotes')} />
            </Form.Item>
            <Form.Item name="remark" label={t('remark')}>
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleCreateSubmit} block>
                {t('confirmAdd')}
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 移动端新增会员抽屉 */}
      {isMobile && (
        <Drawer
          title={t('addMember')}
          open={createDrawerVisible}
          onClose={() => setCreateDrawerVisible(false)}
          placement="bottom"
          height="80%"
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
            <Form.Item name="name" label={t('name')} rules={[{ required: true, message: t('pleaseEnterName') }]}>
              <Input size="large" placeholder={t('pleaseEnterName')} />
            </Form.Item>
            <Form.Item name="phone" label={t('phone')} rules={[{ required: true, message: t('pleaseEnterPhone') }]}>
              <Input size="large" placeholder={t('pleaseEnterPhone')} />
            </Form.Item>
            <Form.Item name="registrationDate" label={t('registrationDate')} rules={[{ required: true, message: t('pleaseSelectRegistrationDate') }]}>
              <DatePicker 
                size="large"
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                placeholder={t('pleaseSelectRegistrationDate')}
              />
            </Form.Item>
            <Form.Item name="voucherNumber" label={t('voucherNumber')} rules={[{ required: true, message: t('pleaseEnterVoucherNumber') }]}>
              <InputNumber size="large" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height" label={t('height') + ' (cm)'}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} max={300} placeholder={t('pleaseEnterHeight')} />
            </Form.Item>
            <Form.Item name="weight" label={t('weight') + ' (kg)'}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} max={500} step={0.1} placeholder={t('pleaseEnterWeight')} />
            </Form.Item>
            <Form.Item name="size" label={t('size')}>
              <Input size="large" placeholder={t('pleaseEnterSize')} />
            </Form.Item>
            <Form.Item name="personalNotes" label={t('personalNotes')}>
              <Input.TextArea size="large" rows={4} placeholder={t('pleaseEnterPersonalNotes')} />
            </Form.Item>
            <Form.Item name="remark" label={t('remark')}>
              <Input size="large" placeholder={t('remark')} />
            </Form.Item>
            <div className="flex gap-3 mt-6">
              <Button block size="large" onClick={() => setCreateDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block size="large" htmlType="submit">
                {t('confirm')}
              </Button>
            </div>
          </Form>
        </Drawer>
      )}

      {/* 删除确认弹窗 */}
      <Modal
        title={t('deleteConfirm')}
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t('confirmDelete')}
        cancelText={t('cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('confirmDeleteMember', { name: selectedMember?.name })}</p>
      </Modal>
    </div>
  );
}