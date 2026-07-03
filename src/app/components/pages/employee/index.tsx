'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, message, Form, Input, Select, InputNumber, notification, Card, Tag, Modal, Drawer } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { User, UserFormData } from '@/lib/types';
import { USER_PERMISSIONS } from '@/lib/endpoints';
import { usePermissions } from '@/lib/usePermissions';
import UniversalTable from '../../UniversalTable';
import { TableColumn, TableAction, AdvancedSearchConfig, DrawerConfig, DeleteConfig } from '@/lib/table-types';

const { Option } = Select;

export default function EmployeeManagement() {
  const { t } = useTranslation();
  const { canUseFeature } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const hasInitialized = useRef(false);
  const [searchText, setSearchText] = useState('');

  // 获取用户列表
  const fetchUsers = async (searchParams?: any, pagination?: any) => {
    setLoading(true);
    try {
      const params = {
        searchPage: {
          desc: 1,
          page: pagination?.current || 1,
          pageSize: pagination?.pageSize || 20,
          sort: '',
        },
        keyWord: searchParams?.name || '',
      };
      
      const response = await api.user.getList(params);
        if (response.code === 200) {
          setUsers(response.data.content);
          // 更新分页信息
          if (pagination) {
            pagination.total = response.data.totalElements;
            pagination.current = response.data.number + 1;
          }
        } else {
          notification.error({
            message: t('fetchUserListFailed'),
            description: response.msg || t('unknownError'),
            duration: 4.5,
          });
        }
    } catch (error) {
      message.error(t('fetchUserListFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchUsers();
    }
  }, []);

  // 搜索处理
  const handleSearch = (values: any) => {
    fetchUsers(values);
  };

  // 分页处理
  const handlePaginationChange = (page: number, pageSize: number) => {
    fetchUsers(searchForm.getFieldsValue(), { current: page, pageSize });
  };

  // 打开添加用户drawer
  const handleAdd = () => {
    setEditingUser(null);
    editForm.resetFields();
    setDrawerVisible(true);
  };

  // 打开编辑用户drawer
  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name,
      type: user.type,
    });
    setDrawerVisible(true);
  };

  // 删除用户
  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    try {
      const response = await api.user.delete([deletingUser.id] );
        if (response.code === 200) {
          message.success(t('deleteSuccess'));
          setDeleteModalVisible(false);
          setDeletingUser(null);
          fetchUsers();
        } else {
          notification.error({
            message: t('deleteFailed'),
            description: response.msg || t('unknownError'),
            duration: 4.5,
          });
        }
    } catch (error) {
      message.error(t('deleteFailed'));
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // 编辑用户
        const modifyData = {
          id: editingUser.id,
          name: values.name,
          type: values.type,
        };
        const response = await api.user.modify(modifyData);
        if (response.code === 200) {
          message.success(t('modifySuccess'));
          setDrawerVisible(false);
          editForm.resetFields();
          fetchUsers();
        } else {
          notification.error({
            message: t('modifyFailed'),
            description: response.msg || t('unknownError'),
            duration: 4.5,
          });
        }
      } else {
        // 创建用户
        const createData = {
          name: values.name,
          type: values.type,
          password: values.password,
        };
        const response = await api.user.create(createData);
        if (response.code === 200) {
          message.success(t('createSuccess'));
          setDrawerVisible(false);
          editForm.resetFields();
          fetchUsers();
        } else {
          notification.error({
            message: t('createFailed'),
            description: response.msg || t('unknownError'),
            duration: 4.5,
          });
        }
      }
    } catch (error) {
      message.error(t('operationFailed'));
    }
  };

  // 表格列定义
  const columns: TableColumn[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('permission'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => {
        const permission = USER_PERMISSIONS.find(p => p.value === type);
        return permission ? permission.label : type;
      },
    },
  ];

  // 操作配置 - 根据权限过滤
  const allActions: TableAction[] = [
    {
      key: 'edit',
      label: t('edit'),
      icon: <EditOutlined />,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: t('delete'),
      icon: <DeleteOutlined />,
      onClick: handleDelete,
      danger: true,
    },
  ];

  const actions = allActions.filter(action => {
    switch (action.key) {
      case 'edit':
        return canUseFeature('editEmployee');
      case 'delete':
        return canUseFeature('deleteEmployee');
      default:
        return true;
    }
  });

  // 高级搜索配置
  const advancedSearch: AdvancedSearchConfig = {
    visible: true,
    onToggle: () => {},
    form: searchForm,
    onSearch: handleSearch,
    onReset: () => {
      searchForm.resetFields();
      fetchUsers();
    },
    children: (
      <>
        <Form.Item label={t('name')} name="name">
          <Input placeholder={t('pleaseEnterName')} />
        </Form.Item>
      </>
    ),
  };

  // 编辑Drawer配置（桌面端）
  const editDrawer: DrawerConfig = {
    title: editingUser ? t('editEmployee') : t('addEmployee'),
    visible: drawerVisible,
    onClose: () => setDrawerVisible(false),
    onSubmit: handleSubmit,
    form: editForm,
    children: (
      <>
        <Form.Item
          label={t('account')}
          name="name"
          rules={[{ required: true, message: t('pleaseEnterAccount') }]}
        >
          <Input placeholder={t('pleaseEnterAccount')} />
        </Form.Item>

        {!editingUser && (
          <Form.Item
            label={t('password')}
            name="password"
            rules={[{ required: true, message: t('pleaseEnterPassword') }]}
          >
            <Input.Password placeholder={t('pleaseEnterPassword')} />
          </Form.Item>
        )}

        <Form.Item
          label={t('permission')}
          name="type"
          rules={[{ required: true, message: t('pleaseSelectPermission') }]}
        >
          <Select placeholder={t('pleaseSelectPermission')}>
            {USER_PERMISSIONS.map(permission => (
              <Option key={permission.value} value={permission.value}>
                {permission.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </>
    ),
  };

  // 删除Modal配置
  const deleteModal: DeleteConfig = {
    title: t('confirmDelete'),
    content: `${t('confirmDelete')} "${deletingUser?.name}" ${t('question')}`,
    visible: deleteModalVisible,
    onConfirm: handleConfirmDelete,
    onCancel: () => {
      setDeleteModalVisible(false);
      setDeletingUser(null);
    },
  };

  // 筛选数据（移动端）
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 渲染员工卡片（移动端）
  const renderEmployeeCard = (user: User) => (
    <Card 
      key={user.id}
      size="small"
      className="shadow-sm mb-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-base font-semibold text-gray-800">{user.name}</span>
            <Tag color="orange">
              {USER_PERMISSIONS.find(p => p.value === user.type)?.label || user.type}
            </Tag>
          </div>
        </div>
        <div className="flex gap-2">
          {canUseFeature('editEmployee') && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(user)}
            >
              {t('edit')}
            </Button>
          )}
          {canUseFeature('deleteEmployee') && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(user)}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
      {/* 桌面端视图 */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg p-6">
        <UniversalTable
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('totalRecordsCount', { total }),
            onChange: handlePaginationChange,
          }}
          advancedSearch={advancedSearch}
          onAdd={handleAdd}
          addButtonText={t('addEmployee')}
          showAddButton={canUseFeature('createEmployee')}
          editDrawer={editDrawer}
          deleteModal={deleteModal}
          actions={actions}
          maxVisibleActions={2}
        />
      </div>

      {/* 移动端视图 */}
      <div className="md:hidden pb-20">
        {/* 搜索和新增 */}
        <div className="mb-4 space-y-3">
          <Input
            placeholder={t('searchNameOrPhone')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            allowClear
          />
          {canUseFeature('createEmployee') && (
            <Button
              type="primary"
              block
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('addEmployee')}
            </Button>
          )}
        </div>

        {/* 员工列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('loading')}</div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(renderEmployeeCard)
          ) : (
            <div className="text-center py-8 text-gray-400">{t('noEmployees')}</div>
          )}
        </div>

        {/* 移动端编辑抽屉 */}
        <Drawer
          title={editingUser ? t('editEmployee') : t('addEmployee')}
          placement="bottom"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          height="80%"
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label={t('account')}
              rules={[{ required: true, message: t('pleaseEnterAccount') }]}
            >
              <Input size="large" placeholder={t('pleaseEnterAccount')} />
            </Form.Item>

            <Form.Item
              name="type"
              label={t('permission')}
              rules={[{ required: true, message: t('pleaseSelectPermission') }]}
            >
              <Select size="large" placeholder={t('pleaseSelectPermission')}>
                {USER_PERMISSIONS.map(permission => (
                  <Select.Option key={permission.value} value={permission.value}>
                    {permission.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label={t('password')}
                rules={[{ required: true, message: t('pleaseEnterPassword') }]}
              >
                <Input.Password size="large" placeholder={t('pleaseEnterPassword')} />
              </Form.Item>
            )}

            <div className="flex gap-3 mt-6">
              <Button block size="large" onClick={() => setDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block size="large" htmlType="submit">
                {t('confirm')}
              </Button>
            </div>
          </Form>
        </Drawer>

        {/* 移动端删除确认弹窗 */}
        <Modal
          title={t('delete')}
          open={deleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setDeletingUser(null);
          }}
          okText={t('confirm')}
          cancelText={t('cancel')}
          okButtonProps={{ danger: true }}
        >
          <p>{t('confirmDelete')} {deletingUser?.name}{t('question')}</p>
        </Modal>
      </div>
    </div>
  );
}
