import React, { useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { IonButton, IonInputPasswordToggle, IonRouterLink } from '@ionic/react';
import { BiaInput, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useConnectivityStore } from '@shared/index';
import styles from './LoginForm.module.css';

interface LoginFormInputs {
  username: string;
  password: string;
}

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    trigger,
    watch,
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
  });

  const { t } = useTranslation(TranslationNamespaces.LOGIN);
  const isOnline = useConnectivityStore((state) => state.isOnline);

  // Ref para el contenedor del formulario
  const formRef = useRef<HTMLFormElement>(null);

  // Watch para detectar cambios en los valores
  const watchedValues = watch();

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    onLogin(data.username, data.password);
  };

  const handleInputChange = async (
    field: keyof LoginFormInputs,
    value: string
  ) => {
    setValue(field, value);
    await trigger(field); // Disparar validación de campo específico
  };

  // Detectar autocompletado del navegador
  useEffect(() => {
    const checkAutocomplete = async () => {
      if (!formRef.current) return;

      // Buscar los inputs dentro del formulario
      const usernameInput = formRef.current.querySelector(
        'ion-input[type="email"] input'
      ) as HTMLInputElement;
      const passwordInput = formRef.current.querySelector(
        'ion-input[type="password"] input'
      ) as HTMLInputElement;

      if (usernameInput && passwordInput) {
        const usernameValue = usernameInput.value;
        const passwordValue = passwordInput.value;

        // Si hay valores pero no están en react-hook-form, fueron autocompletados
        if (usernameValue && usernameValue !== (watchedValues.username || '')) {
          setValue('username', usernameValue);
          await trigger('username');
        }

        if (passwordValue && passwordValue !== (watchedValues.password || '')) {
          setValue('password', passwordValue);
          await trigger('password');
        }
      }
    };

    // Verificar inmediatamente
    checkAutocomplete();

    // Verificar después de un pequeño delay para dar tiempo al autocompletado
    const timeouts = [
      setTimeout(checkAutocomplete, 100),
      setTimeout(checkAutocomplete, 500),
      setTimeout(checkAutocomplete, 1000),
    ];

    // Observer para detectar cambios en el DOM
    let observer: MutationObserver | null = null;

    if (formRef.current) {
      observer = new MutationObserver(() => {
        setTimeout(checkAutocomplete, 50);
      });

      observer.observe(formRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value'],
      });
    }

    // Event listeners en el documento para capturar autocompletado
    const handleDocumentChange = () => {
      setTimeout(checkAutocomplete, 50);
    };

    document.addEventListener('input', handleDocumentChange, true);
    document.addEventListener('change', handleDocumentChange, true);

    return () => {
      timeouts.forEach(clearTimeout);
      if (observer) {
        observer.disconnect();
      }
      document.removeEventListener('input', handleDocumentChange, true);
      document.removeEventListener('change', handleDocumentChange, true);
    };
  }, [setValue, trigger, watchedValues.username, watchedValues.password]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className={styles.loginForm}
    >
      {/* Campo de entrada de correo electrónico */}
      <BiaInput
        type='email'
        label={t('username')}
        required
        error={!!errors.username}
        errorMessage={errors.username?.message}
        onIonInput={(e) => handleInputChange('username', e.detail?.value || '')}
        {...register('username', {
          required: t('user_required'),
          pattern: {
            value: /^\S+@\S+$/i,
            message: t('user_invalid'),
          },
          onChange: (e) => handleInputChange('username', e.detail?.value || ''),
        })}
        disabled={loading}
      />

      {/* Campo de entrada de contraseña */}
      <BiaInput
        type='password'
        label={t('password')}
        required
        error={!!errors.password}
        errorMessage={errors.password?.message}
        onIonInput={(e) => handleInputChange('password', e.detail?.value || '')}
        {...register('password', {
          required: t('password_required'),
          onChange: (e) => handleInputChange('password', e.detail?.value || ''),
        })}
        disabled={loading}
      >
        <IonInputPasswordToggle slot='end'></IonInputPasswordToggle>
      </BiaInput>

      {/* Link para recuperar contraseña */}
      <IonRouterLink
        href='/forgot-password'
        className={styles.forgotPasswordText}
      >
        <BiaText
          token='caption'
          color='accent'
        >
          {t('forgot_password')}
        </BiaText>
      </IonRouterLink>

      {/* Botón de inicio de sesión */}
      <IonButton
        type='submit'
        expand='block'
        {...(loading || !isValid || !isOnline ? { disabled: true } : {})}
      >
        {loading ? t('login_loading') : t('login')}
      </IonButton>
    </form>
  );
};
