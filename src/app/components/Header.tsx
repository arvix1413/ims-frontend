'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp, Dropdown, Form, Input, Modal } from 'antd';
import type { MenuProps } from 'antd';
import {
  CheckOutlined,
  DownOutlined,
  GlobalOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { authManager } from '@/lib/auth';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/usePermissions';
import { Menu as MenuIcon } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { userInfo, loading } = usePermissions();
  const { message } = AntdApp.useApp();
  const [passwordForm] = Form.useForm<ChangePasswordValues>();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLanguageChange = (language: 'zh' | 'en') => {
    void i18n.changeLanguage(language);
  };

  const handleAccountMenuClick: NonNullable<MenuProps['onClick']> = ({ key }) => {
    if (key === 'change-password') {
      setPasswordModalOpen(true);
    } else if (key === 'language-zh') {
      handleLanguageChange('zh');
    } else if (key === 'language-en') {
      handleLanguageChange('en');
    } else if (key === 'logout') {
      authManager.logout();
    }
  };

  const closePasswordModal = () => {
    if (savingPassword) return;
    setPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const handlePasswordChange = async (values: ChangePasswordValues) => {
    setSavingPassword(true);
    try {
      const response = await api.user.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (response.code === 200) {
        message.success(t('changePasswordSuccess'));
        setPasswordModalOpen(false);
        passwordForm.resetFields();
      }
    } catch {
      message.error(t('changePasswordFailed'));
    } finally {
      setSavingPassword(false);
    }
  };

  const accountMenuItems: NonNullable<MenuProps['items']> = [
    {
      type: 'group',
      label: (
        <div className="min-w-40 py-1">
          <div className="font-semibold text-gray-900">{userInfo?.name}</div>
          <div className="mt-0.5 text-xs font-normal text-gray-500">{userInfo?.type}</div>
        </div>
      ),
    },
    { type: 'divider' },
    ...(userInfo?.id
      ? [{ key: 'change-password', icon: <LockOutlined />, label: t('changePassword') }]
      : []),
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: t('language'),
      children: [
        {
          key: 'language-zh',
          label: '中文',
          icon: i18n.language === 'zh' ? <CheckOutlined /> : undefined,
        },
        {
          key: 'language-en',
          label: 'English',
          icon: i18n.language === 'zh' ? undefined : <CheckOutlined />,
        },
      ],
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('logout'), danger: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 min-w-full border-b border-gray-700 bg-gray-900 px-4 py-3 shadow-sm md:px-6 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-0">
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-800 active:bg-gray-700 md:hidden"
              aria-label="打开菜单"
            >
              <MenuIcon className="h-6 w-6 text-white" />
            </button>
            <div className="text-xl font-bold text-white md:text-2xl">Slady</div>
          </div>

          <div className="flex flex-shrink-0 items-center">
            {loading ? (
              <div className="text-xs text-gray-300 md:text-sm">{t('loading')}</div>
            ) : userInfo ? (
              <Dropdown
                menu={{ items: accountMenuItems, onClick: handleAccountMenuClick }}
                trigger={['click']}
                placement="bottomRight"
                arrow
              >
                <button
                  type="button"
                  className="flex min-h-10 items-center gap-2 rounded-full p-1 pr-2 text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label={t('accountMenu', { name: userInfo.name })}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium md:h-10 md:w-10">
                    {userInfo.name?.trim().charAt(0).toUpperCase()}
                  </span>
                  <DownOutlined className="text-xs text-gray-300" />
                </button>
              </Dropdown>
            ) : (
              <div className="text-xs text-gray-300 md:text-sm">{t('userInfoNotFound')}</div>
            )}
          </div>
        </div>
      </header>

      <Modal
        title={t('changePassword')}
        open={passwordModalOpen}
        className="change-password-modal"
        onCancel={closePasswordModal}
        footer={null}
        destroyOnClose
        maskClosable={!savingPassword}
        keyboard={!savingPassword}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handlePasswordChange}
          className="mt-5"
        >
          <Form.Item
            label={t('currentPassword')}
            name="currentPassword"
            rules={[{ required: true, message: t('passwordRequired') }]}
          >
            <Input.Password autoComplete="current-password" maxLength={128} />
          </Form.Item>
          <Form.Item
            label={t('newPassword')}
            name="newPassword"
            rules={[
              { required: true, message: t('passwordRequired') },
              { min: 8, max: 128, message: t('passwordLength') },
            ]}
          >
            <Input.Password autoComplete="new-password" maxLength={128} />
          </Form.Item>
          <Form.Item
            label={t('confirmNewPassword')}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('passwordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" maxLength={128} />
          </Form.Item>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={closePasswordModal}
              disabled={savingPassword}
              className="min-h-10 rounded-md border border-gray-300 px-4 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="password-submit-button min-h-10 rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {savingPassword ? t('loading') : t('save')}
            </button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
