'use client';

import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Form as AntForm } from 'antd';
import type { FormInstance, FormProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/lib/notificationManager';

type FailedInfo = Parameters<NonNullable<FormProps['onFinishFailed']>>[0];

const focusFirstInvalidField = () => {
  window.requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>(
      '.ant-form-item-has-error input:not([disabled]), .ant-form-item-has-error textarea:not([disabled]), .ant-form-item-has-error .ant-select-selector, .ant-form-item-has-error button:not([disabled])',
    );
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => field.focus({ preventScroll: true }), 250);
  });
};

const getValidationMessages = (errorInfo: any) =>
  Array.from(
    new Set<string>(
      (errorInfo?.errorFields ?? [])
        .flatMap((field: any) => field.errors ?? [])
        .map((message: unknown) => String(message).trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);

/** Also covers drawers/modals whose primary button calls form.validateFields(). */
function useValidatedForm<Values = any>(form?: FormInstance<Values>): [FormInstance<Values>] {
  const [instance] = AntForm.useForm<Values>(form);
  const { t } = useTranslation();
  const notification = useNotification();
  const feedbackRef = useRef({ t, notification });
  feedbackRef.current = { t, notification };

  const validatedInstance = useMemo(
    () =>
      new Proxy(instance, {
        get(target, property, receiver) {
          if (property !== 'validateFields') {
            return Reflect.get(target, property, receiver);
          }
          return async (...args: any[]) => {
            try {
              return await (target.validateFields as any)(...args);
            } catch (error: any) {
              if (error?.errorFields?.length) {
                const current = feedbackRef.current;
                const messages = getValidationMessages(error);
                current.notification.custom({
                  key: 'global-form-validation',
                  type: 'warning',
                  message: current.t('pleaseCheckRequiredFields'),
                  description: messages.length ? messages.join(' · ') : undefined,
                  duration: 4.5,
                  placement: 'topRight',
                });
                focusFirstInvalidField();
              }
              throw error;
            }
          };
        },
      }),
    [instance],
  );

  return [validatedInstance];
}

/**
 * Application-wide Ant Design form wrapper.
 *
 * Every submit-driven form receives the same validation feedback: a visible,
 * auto-closing summary and focus on the first invalid field. Static APIs such
 * as Form.Item/Form.List/Form.useForm are preserved via Object.assign below.
 */
const ValidatedFormBase = forwardRef<any, FormProps>((props, ref) => {
  const { t } = useTranslation();
  const notification = useNotification();
  const { onFinishFailed, scrollToFirstError, ...rest } = props;

  const handleFinishFailed = useCallback(
    (errorInfo: FailedInfo) => {
      onFinishFailed?.(errorInfo);

      const messages = getValidationMessages(errorInfo);

      notification.custom({
        key: 'global-form-validation',
        type: 'warning',
        message: t('pleaseCheckRequiredFields'),
        description: messages.length ? messages.join(' · ') : undefined,
        duration: 4.5,
        placement: 'topRight',
      });
      focusFirstInvalidField();
    },
    [notification, onFinishFailed, t],
  );

  return React.createElement(AntForm as React.ComponentType<any>, {
    ...rest,
    ref,
    onFinishFailed: handleFinishFailed,
    scrollToFirstError:
      scrollToFirstError ?? { behavior: 'smooth', block: 'center', focus: true },
  });
});

ValidatedFormBase.displayName = 'ValidatedForm';

const Form = Object.assign(ValidatedFormBase, AntForm, {
  useForm: useValidatedForm,
}) as typeof AntForm;

export default Form;
