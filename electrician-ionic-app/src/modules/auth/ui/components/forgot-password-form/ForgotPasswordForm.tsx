import React from 'react';
import { IonButton, useIonRouter } from '@ionic/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BiaInput } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ForgotPasswordForm.module.css';

interface ForgotPassFormInputs {
  email: string;
}

interface ForgotPassFormProps {
  onResetPassword: (email: string) => void;
  loading: boolean;
}

export const ForgotPassForm: React.FC<ForgotPassFormProps> = ({
  onResetPassword,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    trigger,
  } = useForm<ForgotPassFormInputs>({
    mode: 'onChange',
  });
  const router = useIonRouter();
  const { t } = useTranslation(TranslationNamespaces.LOGIN);

  const onSubmit: SubmitHandler<ForgotPassFormInputs> = (data) => {
    onResetPassword(data.email);
  };

  const handleInputChange = async (
    field: keyof ForgotPassFormInputs,
    value: string
  ) => {
    setValue(field, value);
    await trigger(field);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles.forgotPassForm}
    >
      <BiaInput
        type='email'
        label={t('username')}
        required
        error={!!errors.email}
        errorMessage={errors.email?.message}
        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
        {...register('email', {
          required: t('user_required'),
          pattern: {
            value: /^\S+@\S+$/i,
            message: t('user_invalid'),
          },
          onChange: (e) => handleInputChange('email', e.detail.value!),
        })}
        disabled={loading}
      />

      <IonButton
        type='submit'
        expand='block'
        {...(loading || !isValid ? { disabled: true } : {})}
      >
        {t('reset_password')}
      </IonButton>

      <IonButton
        className={styles.cancelButton}
        expand='block'
        onClick={() => router.goBack()}
      >
        {t('cancel')}
      </IonButton>
    </form>
  );
};
