import { BiaIcon, BiaLoader, BiaToast, Header } from '@entropy/index';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonPage,
  useIonRouter,
} from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import styles from './Arrival.module.css';
import React, { useState } from 'react';
import { fetchPostArrivalPhotos } from '@mobile/visits/data/arrivalPhotos';
import { IArrivalPhoto } from '@mobile/visits/data/interfaces/arrival.interface';
import { fetchUploadFileAIArrivalPhoto } from '@mobile/visits/data/uploadFileS3';
import { fetchChangeActivityStatus } from '@mobile/visits/data/activityStatus';
import { ActivityStatus } from '@mobile/visits/data/interfaces/visits.interface';
import { IActivityStatus } from '@mobile/visits/data/interfaces/activityStatus.interface';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { useImageCompression } from '@shared/hooks/useImageCompression';

type IvisitDetailProps = RouteComponentProps<{
  id?: string;
}>;
export const ArrivalVisit = ({ match }: IvisitDetailProps) => {
  const activity_id = match.params.id ?? '';
  const router = useIonRouter();
  const isOnline = useConnectivityStore.getState().isOnline;

  const [listPhotos, setListPhotos] = useState<IArrivalPhoto[]>([]);
  const [isLoadingArrival, setIsLoadingArrival] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    title?: string;
    message?: string;
    theme: 'success' | 'error';
  }>({ title: '', message: '', theme: 'success' });

  // Hook para compresión de imágenes
  const { compressMultipleImages, isCompressing } = useImageCompression();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      // Filtrar solo archivos de imagen
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );

      // Validar que hay archivos de imagen válidos
      if (imageFiles.length === 0) {
        setToastMessage({
          title: 'Archivos no válidos',
          message: 'Solo puedes subir archivos de imagen (PNG, JPG, etc.)',
          theme: 'error',
        });
        setShowToast(true);
        return;
      }

      const remainingSlots = 3 - listPhotos.length;

      if (remainingSlots <= 0) {
        setToastMessage({
          title: 'Límite alcanzado',
          message: 'Solo puedes subir máximo 3 fotos',
          theme: 'error',
        });
        setShowToast(true);
        return;
      }

      setIsLoadingArrival(true);
      const filesToProcess = imageFiles.slice(0, remainingSlots);

      try {
        // ✅ COMPRIMIR IMÁGENES ANTES DE PROCESARLAS
        const compressionOptions = {
          maxSizeMB: 0.8, // 800KB máximo
          maxWidthOrHeight: 1920, // Full HD máximo
          useWebWorker: true,
          initialQuality: 0.8,
        };

        const compressionResults = await compressMultipleImages(
          filesToProcess,
          compressionOptions
        );

        // Procesar archivos comprimidos
        const processCompressedFiles = compressionResults.map((result) => {
          return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const url = reader.result as string;
              setListPhotos((prev) => {
                if (prev.length < 3) {
                  return [
                    ...prev,
                    {
                      blob: result.compressedFile, // 🆕 Blob comprimido (requerido)
                      captured_at: new Date().toISOString(),
                      url, // Data URL para display (opcional)
                    },
                  ];
                }
                return prev;
              });
              resolve();
            };
            reader.readAsDataURL(result.compressedFile);
          });
        });

        await Promise.all(processCompressedFiles);

        // Mostrar estadísticas de compresión
        const totalOriginalSize = compressionResults.reduce(
          (acc, result) => acc + result.originalSize,
          0
        );
        const totalCompressedSize = compressionResults.reduce(
          (acc, result) => acc + result.compressedSize,
          0
        );
        const compressionRatio = (
          ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) *
          100
        ).toFixed(1);

        setIsLoadingArrival(false);

        // Mostrar mensajes informativos si es necesario
        const rejectedFiles = files.length - imageFiles.length;
        const excessFiles = imageFiles.length - remainingSlots;

        if (rejectedFiles > 0 && excessFiles > 0) {
          setToastMessage({
            title: 'Archivos procesados',
            message: `Se cargaron ${filesToProcess.length} fotos (comprimidas ${compressionRatio}%). ${rejectedFiles} archivos no eran imágenes y ${excessFiles} excedían el límite de 3.`,
            theme: 'success',
          });
          setShowToast(true);
        } else if (rejectedFiles > 0) {
          setToastMessage({
            title: 'Archivos procesados',
            message: `${rejectedFiles} archivos no eran imágenes válidas. Se cargaron ${filesToProcess.length} fotos (comprimidas ${compressionRatio}%).`,
            theme: 'success',
          });
          setShowToast(true);
        } else if (excessFiles > 0) {
          setToastMessage({
            title: 'Fotos cargadas',
            message: `Se cargaron ${filesToProcess.length} fotos (comprimidas ${compressionRatio}%). ${excessFiles} fotos excedían el límite de 3.`,
            theme: 'success',
          });
          setShowToast(true);
        } else {
          setToastMessage({
            title: 'Fotos cargadas exitosamente',
            message: `${filesToProcess.length} fotos comprimidas (reducción: ${compressionRatio}%)`,
            theme: 'success',
          });
          setShowToast(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setIsLoadingArrival(false);
        setToastMessage({
          title: 'Error al comprimir imágenes',
          message: 'No se pudieron procesar las imágenes. Inténtalo de nuevo.',
          theme: 'error',
        });
        setShowToast(true);
      }
    } else {
      setToastMessage({
        title: 'Hubo un error al cargar la foto.',
        message: 'Inténtalo de nuevo.',
        theme: 'error',
      });
      setShowToast(true);
    }
  };

  const handelSaveArrive = async () => {
    // save photos to db
    setIsLoadingArrival(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedPhotos: any[] = [];

      // Procesar fotos secuencialmente con delay de 1 segundo entre cada una
      for (let index = 0; index < listPhotos.length; index++) {
        const photo = listPhotos[index];

        try {
          // Verificar que tengamos el blob (debe estar siempre presente)
          if (!photo.blob) {
            throw new Error('Blob no disponible para la foto');
          }

          // 🆕 Usar la foto directamente ya que ahora IArrivalPhoto incluye blob
          const photoForUpload: IArrivalPhoto = photo;

          const response = await fetchUploadFileAIArrivalPhoto(
            photoForUpload,
            activity_id,
            index
          );
          // Reemplazar el url por el location obtenido de la promesa (sin blob para backend)
          updatedPhotos.push({
            url: response.location,
            captured_at: photo.captured_at,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any); // Temporal para compatibilidad con backend
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (photoError) {
          // Mantener la foto original si falla la subida (sin el blob para no enviarlo al backend)
          updatedPhotos.push({
            url: photo.url,
            captured_at: photo.captured_at,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any); // Temporal para compatibilidad con backend
        }

        // Agregar delay de 1 segundo entre fotos (excepto la última)
        if (index < listPhotos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setIsLoadingArrival(false);
      uploadArrivalPhotos(updatedPhotos);
    } catch (error) {
      console.error('error', error);
      setToastMessage({
        title: 'Error',
        message: 'Error al guardar las fotos',
        theme: 'error',
      });
      setShowToast(true);
      setIsLoadingArrival(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadArrivalPhotos = async (updatedPhotos: any[]) => {
    // Ahora usar fetchPostArrivalPhotos con las fotos actualizadas
    setIsLoadingArrival(true);
    const saveResponse = await fetchPostArrivalPhotos(
      activity_id,
      updatedPhotos
    );
    if (saveResponse.success) {
      setIsLoadingArrival(false);
      changeActivityStatus();
    } else {
      setToastMessage({
        title: 'Error',
        message: 'Error al guardar las fotos',
        theme: 'error',
      });
      setShowToast(true);
      setIsLoadingArrival(false);
    }
  };

  const changeActivityStatus = async () => {
    setIsLoadingArrival(true);
    const activityStatus: IActivityStatus[] = [
      {
        status: ActivityStatus.IN_ADDRESS,
        created_at_app: new Date().toISOString(),
        is_online: isOnline ?? false,
      },
    ];
    fetchChangeActivityStatus(activity_id, activityStatus)
      .then(() => {
        setIsLoadingArrival(false);
        router.goBack();
      })
      .catch(() => {
        setToastMessage({
          title: 'Error',
          message: 'Error al cambiar el estado de la actividad',
          theme: 'error',
        });
        setIsLoadingArrival(false);
      });
  };

  const removePhoto = (index: number) => {
    setListPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addPhoto = () => {
    if (listPhotos.length >= 3) {
      setToastMessage({
        title: 'Límite alcanzado',
        message: 'Solo puedes subir máximo 3 fotos',
        theme: 'error',
      });
      setShowToast(true);
      return;
    }
    document.getElementById(`photo-input-${activity_id}`)?.click();
  };

  return (
    <IonPage id='main-content'>
      {(isLoadingArrival || isCompressing) && (
        <BiaLoader
          color='accent'
          className={styles.loader}
          text={isCompressing ? 'Comprimiendo imágenes...' : undefined}
        />
      )}

      <Header
        text='Registro de llegada'
        iconBackButton='faX'
        backButton
      />
      <IonContent>
        <div className={styles.container}>
          <p className={styles.title}>
            Carga una o más fotos evidencia de tu llegada al sitio de la visita.
          </p>
          <input
            id={`photo-input-${activity_id}`}
            type='file'
            accept='image/*'
            multiple={true}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            value={undefined}
          />
          {listPhotos.length === 0 && (
            <React.Fragment>
              <div
                className={styles.box_pick_image}
                onClick={addPhoto}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addPhoto();
                  }
                }}
              >
                <BiaIcon
                  className={styles.icon}
                  iconName='faImage'
                  iconType='regular'
                  size='1.25em' // 20px
                />
                <p>Cargar registro de llegada a sitio</p>
              </div>
            </React.Fragment>
          )}
          {listPhotos.length > 0 && (
            <React.Fragment>
              <section className={styles.box_images_selected}>
                {listPhotos.length < 3 && (
                  <div
                    className={styles.box_pick_image}
                    onClick={addPhoto}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        addPhoto();
                      }
                    }}
                  >
                    <BiaIcon
                      className={styles.icon}
                      iconName='faPlus'
                      iconType='regular'
                      size='1.25em' // 20px
                    />
                  </div>
                )}
                {listPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className={styles.image_selected}
                  >
                    <div
                      className={styles.box_icon}
                      onClick={() => removePhoto(index)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          removePhoto(index);
                        }
                      }}
                    >
                      <BiaIcon
                        className={styles.icon}
                        iconName='faX'
                        iconType='regular'
                        size='15px'
                      />
                    </div>
                    <img
                      key={index}
                      src={photo.url}
                      alt={`photo-${index}`}
                    />
                  </div>
                ))}
              </section>
            </React.Fragment>
          )}
        </div>
      </IonContent>
      <IonFooter>
        <footer className={styles.footer}>
          <IonButton
            className={styles.footerButton}
            onClick={handelSaveArrive}
            {...(listPhotos.length === 0 ? { disabled: true } : {})}
          >
            Guardar y continuar
          </IonButton>
        </footer>
      </IonFooter>

      {showToast && (
        <BiaToast
          title={toastMessage.title}
          message={toastMessage.message}
          theme={toastMessage.theme}
          onClose={() => setShowToast(false)}
        />
      )}
    </IonPage>
  );
};
