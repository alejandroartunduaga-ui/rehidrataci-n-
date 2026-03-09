import { RouteComponentProps } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Header } from '@entropy/index';
import { PDFVisualizer } from '../../components/PDFVisualizer';

type IDocumentsProps = RouteComponentProps<{
  document_url?: string;
  title?: string;
}>;

export const Documents = ({ match }: IDocumentsProps) => {
  return (
    <IonPage id='main-content'>
      <Header
        text={match.params.title || ''}
        backButton
      />

      <IonContent>
        <div className='ion-padding'>
          <PDFVisualizer
            src={`${decodeURIComponent(match.params.document_url || '')}`}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};
