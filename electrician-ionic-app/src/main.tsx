import './shared/i18n/i18n';
import { createRoot } from 'react-dom/client';
import { TanStackProvider } from '@shared/index';
import App from './App';

const container = document.getElementById('root');

const root = createRoot(container!);

const initializeApp = () => {
  root.render(
    <TanStackProvider>
      <App />
    </TanStackProvider>
  );
};

initializeApp();
