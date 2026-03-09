import React, { useState, useEffect, useRef } from 'react';
import { IonModal, IonToast } from '@ionic/react';
import { BiaIcon, BiaLoader, BiaText, BiaToast } from '@entropy/index';
import { IPhotosAdd } from '@forms-management/data/interfaces/forms.interface';
import { TranslationNamespaces, useImageCompression } from '@shared/index';
import { useTranslation } from 'react-i18next';

import styles from './AddPhoto.module.css';

interface IPropsTrans {
  code: string;
  _activityID?: string;
  currentPhotos: IPhotosAdd[];
  onPhotoAdd: (photo: IPhotosAdd) => void;
  onPhotoDelete: (name: string) => void;
  maxPhotos?: number; // Número máximo de fotos permitidas
}

const AddPhotoComponent: React.FC<IPropsTrans> = ({
  code,
  _activityID,
  currentPhotos,
  onPhotoAdd,
  onPhotoDelete,
  maxPhotos, // Nueva prop para el límite de fotos
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isErrorUploadImage, setIsErrorUploadImage] = useState<boolean>(false);
  const [isMaxPhotosReached, setIsMaxPhotosReached] = useState<boolean>(false);

  // 🧹 Ref para rastrear URLs creadas dinámicamente
  const dynamicUrlsRef = useRef<Set<string>>(new Set());

  // 🔄 Estado para manejar fallback de URLs
  const [fallbackUrls, setFallbackUrls] = useState<Record<string, string>>({});

  const { t } = useTranslation(TranslationNamespaces.FORMS_MANAGEMENT);

  // 🔄 Función para crear fallback DataURL desde blob
  const createFallbackUrl = async (
    photo: IPhotosAdd
  ): Promise<string | null> => {
    if (!photo.blob) return null;

    try {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve(dataUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photo.blob!);
      });
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  };

  // 🖼️ Hook de compresión de imágenes
  const {
    compressImage, // 🔄 Cambio: usar compressImage para obtener Blob
    isCompressing,
    error: compressionError,
    resetError,
  } = useImageCompression();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setOpenModal(false);
      return;
    }

    // Reset previous errors
    resetError();
    setIsErrorUploadImage(false);
    setIsMaxPhotosReached(false);

    // Filtrar solo archivos de imagen
    const imageFiles = Array.from(files).filter((file) => {
      return file.type.startsWith('image/');
    });

    // Si no hay archivos de imagen válidos, mostrar mensaje y salir
    if (imageFiles.length === 0) {
      setOpenModal(false);
      setIsErrorUploadImage(true);
      return;
    }

    // Validar límite máximo de fotos
    if (maxPhotos && currentPhotos.length >= maxPhotos) {
      setOpenModal(false);
      setIsMaxPhotosReached(true);
      return;
    }

    // Calcular cuántas fotos se pueden agregar sin exceder el límite
    const availableSlots = maxPhotos
      ? maxPhotos - currentPhotos.length
      : imageFiles.length;
    const filesToProcess = imageFiles.slice(0, availableSlots);

    // Si se intentan agregar más fotos de las permitidas, mostrar advertencia
    if (maxPhotos && imageFiles.length > availableSlots && availableSlots > 0) {
      setIsMaxPhotosReached(true);
    }

    try {
      // 🖼️ Configuración para fotos de formulario
      const compressionOptions = {
        maxSizeMB: 0.5, // 500KB máximo para formularios
        maxWidthOrHeight: 1280, // HD suficiente para móvil
        initialQuality: 0.8, // Buena calidad visual
        fileType: 'image/jpeg', // Formato optimizado
      };

      const timestamp = Date.now();

      // Procesar archivos uno por uno para mostrar progreso
      for (let index = 0; index < filesToProcess.length; index++) {
        const file = filesToProcess[index];

        try {
          // 🔄 Comprimir imagen y obtener Blob
          const compressionResult = await compressImage(
            file,
            compressionOptions
          );
          const { compressedFile } = compressionResult;

          // 🖼️ Crear URL para display
          const displayUrl = URL.createObjectURL(compressedFile);

          // ✅ Crear objeto de foto con Blob comprimido
          const photoData: IPhotosAdd = {
            code: code,
            url: displayUrl, // URL temporal para mostrar imagen
            blob: compressedFile, // 🆕 Blob para almacenamiento/upload
            displayUrl: displayUrl, // 🆕 URL explícita para display
            name: `compressed-${_activityID || 'no-activity'}-${code}-${timestamp}-${index}`,
          };

          onPhotoAdd(photoData);
          //eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (fileError) {
          // En caso de error, intentar usar la imagen original como fallback
          try {
            // 🖼️ Crear URL para display de la imagen original
            const displayUrl = URL.createObjectURL(file);

            const photoData: IPhotosAdd = {
              code: code,
              url: displayUrl, // URL temporal para mostrar
              blob: file, // 🆕 File original como Blob
              displayUrl: displayUrl, // 🆕 URL explícita para display
              name: `original-${_activityID || 'no-activity'}-${code}-${timestamp}-${index}`,
            };

            onPhotoAdd(photoData);
            //eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (fallbackError) {
            // Continuar con el siguiente archivo
          }
        }
      }

      setOpenModal(false);
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setOpenModal(false);
      setIsErrorUploadImage(true);
    }
  };

  const handleDelete = (name: string) => {
    // 🧹 Limpiar URL de objeto antes de eliminar
    const photoToDelete = currentPhotos.find((photo) => photo.name === name);
    if (photoToDelete?.displayUrl) {
      URL.revokeObjectURL(photoToDelete.displayUrl);
      dynamicUrlsRef.current.delete(photoToDelete.displayUrl);
    }

    // Limpiar fallback URL si existe
    setFallbackUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[name];
      return newUrls;
    });

    onPhotoDelete(name);
  };

  // 🧹 Cleanup de URLs cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpiar todas las URLs de objeto al desmontar el componente
      currentPhotos.forEach((photo) => {
        if (photo.displayUrl) {
          URL.revokeObjectURL(photo.displayUrl);
        }
      });
    };
  }, [currentPhotos]);

  // 🧹 Cleanup de URLs creadas dinámicamente
  useEffect(() => {
    return () => {
      // Limpiar todas las URLs dinámicas al desmontar
      dynamicUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      dynamicUrlsRef.current.clear();
    };
  }, []);

  return (
    <>
      <div className={styles.container}>
        <input
          id={`photo-input-${code}`}
          type='file'
          accept='image/*'
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          value={undefined}
        />
        {currentPhotos.length === 0 ? (
          <React.Fragment>
            <div
              className={`${styles.box_pick_image} ${maxPhotos && currentPhotos.length >= maxPhotos ? styles.disabled : ''}`}
              onClick={() => {
                if (!maxPhotos || currentPhotos.length < maxPhotos) {
                  setOpenModal(true);
                } else {
                  setIsMaxPhotosReached(true);
                }
              }}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!maxPhotos || currentPhotos.length < maxPhotos) {
                    setOpenModal(true);
                  } else {
                    setIsMaxPhotosReached(true);
                  }
                }
              }}
            >
              <BiaIcon
                className={styles.icon}
                iconName='faImage'
                iconType='regular'
                size='1.25em' // 20px
              />
            </div>
          </React.Fragment>
        ) : (
          <section className={styles.box_images_selected}>
            {(!maxPhotos || currentPhotos.length < maxPhotos) && (
              <div
                className={styles.box_pick_image}
                onClick={() => setOpenModal(true)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenModal(true);
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
            {currentPhotos.map((photo, index) => {
              // 🖼️ Determinar qué URL usar para mostrar la imagen
              let imageUrl: string | undefined;
              let hasImage = false;

              // Prioridad: fallbackUrl > displayUrl > url string > crear URL desde blob
              if (fallbackUrls[photo.name]) {
                imageUrl = fallbackUrls[photo.name];
                hasImage = true;
              } else if (photo.displayUrl) {
                imageUrl = photo.displayUrl;
                hasImage = true;
              } else if (typeof photo.url === 'string' && photo.url) {
                imageUrl = photo.url;
                hasImage = true;
              } else if (photo.blob) {
                try {
                  // Si tenemos blob pero no displayUrl, crear la URL
                  const createdUrl = URL.createObjectURL(photo.blob);
                  imageUrl = createdUrl;
                  hasImage = true;

                  // 🧹 Rastrear URL creada dinámicamente
                  dynamicUrlsRef.current.add(createdUrl);
                  //eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                  hasImage = false;
                }
              }

              // Si no hay imagen válida, no mostrar nada
              if (!hasImage || !imageUrl) {
                return null;
              }

              return (
                <React.Fragment
                  key={`${code}-${photo.name || `empty-${index}`}-${index}`}
                >
                  <div
                    key={index}
                    className={styles.image_selected}
                  >
                    <div
                      className={styles.box_icon}
                      onClick={() => handleDelete(photo.name)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDelete(photo.name);
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
                      src={imageUrl}
                      alt='Foto tomada'
                      className={styles.photo_thumbnail}
                      onError={() => {
                        // 🔄 Crear fallback automáticamente cuando falla la carga
                        if (photo.blob && !fallbackUrls[photo.name]) {
                          createFallbackUrl(photo).then((fallbackUrl) => {
                            if (fallbackUrl) {
                              setFallbackUrls((prev) => ({
                                ...prev,
                                [photo.name]: fallbackUrl,
                              }));
                            }
                          });
                        }
                      }}
                      onLoad={() => {
                        // Imagen cargada correctamente
                      }}
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </section>
        )}
      </div>

      {isCompressing && (
        <BiaLoader
          color='accent'
          text='Procesando imagen...'
        />
      )}

      {/* 🔄 Toast de error de compresión */}
      <IonToast
        isOpen={!!compressionError}
        message={compressionError?.message || 'Error al comprimir imagen'}
        color='danger'
        position='top'
        duration={4000}
        onDidDismiss={resetError}
      />

      <IonToast
        isOpen={isErrorUploadImage}
        message={'Solo se permiten archivos de imagen'}
        color='danger'
        position='top'
        duration={3000}
        onDidDismiss={() => setIsErrorUploadImage(false)}
      />
      {isMaxPhotosReached && (
        <BiaToast
          title='Alerta'
          message={
            maxPhotos
              ? `Solo se permiten máximo ${maxPhotos} foto${maxPhotos > 1 ? 's' : ''}`
              : 'Límite de fotos alcanzado'
          }
          duration={3000}
          theme='warning'
          onClose={() => setIsMaxPhotosReached(false)}
        />
      )}

      {/* 🔄 Modal para cargar fotos */}
      <IonModal
        isOpen={openModal}
        initialBreakpoint={0.29}
        breakpoints={[0, 0.29, 0.5, 0.75]}
        backdropDismiss={false}
        className={`${styles.modal} add-photo-modal`}
        onDidDismiss={() => setOpenModal(false)}
      >
        {isCompressing && (
          <BiaLoader
            color='accent'
            text='Procesando imagen...'
          />
        )}
        <div className={styles.wrap_opt_camera}>
          <button
            type='button'
            className={styles.wrap_opt}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const inputElement = document.getElementById(
                `photo-input-${code}`
              );
              inputElement?.click();
            }}
          >
            <BiaIcon
              iconName='faFolder'
              iconType='regular'
              color='accent'
              size='1.25em'
            />
            <BiaText
              token='heading-2'
              color='accent'
            >
              {t('gallery')}
            </BiaText>
          </button>

          <button
            type='button'
            className={styles.wrap_opt}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const inputElement = document.getElementById(
                `photo-input-${code}`
              );
              inputElement?.click();
            }}
          >
            <BiaIcon
              iconName='faCamera'
              iconType='regular'
              color='accent'
              size='1.25em'
            />
            <BiaText
              token='heading-2'
              color='accent'
            >
              {t('camera')}
            </BiaText>
          </button>

          <button
            type='button'
            className={styles.wrap_opt}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenModal(false);
            }}
          >
            <BiaIcon
              iconName='faClose'
              iconType='regular'
              color='error'
              size='1.25em'
            />
            <BiaText
              token='heading-2'
              color='error'
            >
              {t('cancel')}
            </BiaText>
          </button>
        </div>
      </IonModal>
    </>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const AddPhoto = React.memo(AddPhotoComponent);
