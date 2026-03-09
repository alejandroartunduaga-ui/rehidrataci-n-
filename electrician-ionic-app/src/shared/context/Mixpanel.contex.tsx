import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import mixpanel from 'mixpanel-browser';
import { storageManager } from '@shared/index';
import { isDevelopmentEnvironment } from '@shared/utils/environment.utils';

export interface MixpanelProps {
  company: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  user_id: string;
  category: string;
}

interface MixpanelContextProps {
  mixpanelInstance: typeof mixpanel | null;
  mixpanelProps: MixpanelProps;
  setMixpanelProps: React.Dispatch<React.SetStateAction<MixpanelProps>>;
}

const MixpanelContext = createContext<MixpanelContextProps | null>(null);

export const MixpanelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mixpanelInstance, setMixpanelInstance] = useState<
    typeof mixpanel | null
  >(null);
  const [mixpanelProps, setMixpanelProps] = useState<MixpanelProps>(
    {} as MixpanelProps
  );

  useEffect(() => {
    initMixpanel();
  }, []);

  const initMixpanel = async () => {
    if (isDevelopmentEnvironment()) {
      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, { debug: true });
    } else {
      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN);
    }
    setMixpanelInstance(mixpanel);

    const storedProps = await storageManager.getItem('propsMixpanel');
    let initialProps: MixpanelProps;

    if (storedProps) {
      try {
        // Intentar parsear el valor, manejando múltiples niveles de escape
        let parsedValue = storedProps;

        // Si es un string que empieza con comillas, necesita ser parseado
        while (typeof parsedValue === 'string' && parsedValue.startsWith('"')) {
          parsedValue = JSON.parse(parsedValue);
        }

        // Si después de parsear aún es string, intentar parsearlo como JSON
        if (typeof parsedValue === 'string') {
          parsedValue = JSON.parse(parsedValue);
        }

        initialProps = parsedValue as unknown as MixpanelProps;
      } catch (error) {
        console.error('Error parsing propsMixpanel:', error);
        initialProps = {
          company: '',
          name: '',
          email: '',
          phone: '',
          platform: 'App',
          user_id: '',
          category: '',
        };
      }
    } else {
      initialProps = {
        company: '',
        name: '',
        email: '',
        phone: '',
        platform: 'App',
        user_id: '',
        category: '',
      };
    }

    setMixpanelProps(initialProps);
  };

  return (
    <MixpanelContext.Provider
      value={{ mixpanelInstance, mixpanelProps, setMixpanelProps }}
    >
      {children}
    </MixpanelContext.Provider>
  );
};

export const useMixpanel = () => {
  const context = useContext(MixpanelContext);
  if (!context) {
    throw new Error('useMixpanel must be used within a MixpanelProvider');
  }
  return context;
};

export const useTrackEvent = () => {
  const context = useContext(MixpanelContext);

  const trackEvent = async (
    eventName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalProps: Record<string, any> = {}
  ) => {
    // Si no hay contexto disponible, no hacer nada (evitar error)
    if (!context) {
      console.warn('useTrackEvent: MixpanelProvider not available');
      return;
    }

    const { mixpanelInstance, mixpanelProps } = context;

    if (!mixpanelInstance) return;

    const excluded = Cookies.get('excluded');
    if (excluded === 'true') {
      return;
    }

    const propsMixpanel = await storageManager.getItem('propsMixpanel');
    let props: MixpanelProps;

    if (
      Object.keys(mixpanelProps).some(
        (key) => !mixpanelProps[key as keyof MixpanelProps]
      )
    ) {
      try {
        // Intentar parsear el valor, manejando múltiples niveles de escape
        let parsedValue = propsMixpanel || '{}';

        // Si es un string que empieza con comillas, necesita ser parseado
        while (typeof parsedValue === 'string' && parsedValue.startsWith('"')) {
          parsedValue = JSON.parse(parsedValue);
        }

        // Si después de parsear aún es string, intentar parsearlo como JSON
        if (typeof parsedValue === 'string') {
          parsedValue = JSON.parse(parsedValue);
        }

        props = parsedValue as unknown as MixpanelProps;
      } catch (error) {
        console.error('Error parsing propsMixpanel in trackEvent:', error);
        props = mixpanelProps;
      }
    } else {
      props = mixpanelProps;
    }

    mixpanelInstance.track(eventName, { ...props, ...additionalProps });
  };

  return trackEvent;
};
