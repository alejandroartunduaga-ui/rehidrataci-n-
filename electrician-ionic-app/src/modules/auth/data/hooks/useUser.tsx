import mixpanel from 'mixpanel-browser';
import { authEndpoints } from '../endpoints/auth.endpoints';
import {
  authFirebase,
  httpClient,
  MixpanelProps,
  useAuthStore,
} from '@shared/index';
import { isEmailInActiveStaging } from '@shared/services/remoteConfig.service';
import { isStagingScope } from '@shared/utils/environment.utils';
import { mapToAuthResponse } from '../mappers/mapToAuthResponse.mapper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { STAGING_ACCESS_DENIED_MESSAGE } from '@shared/constants/environment.constants';
import { useMutation } from '@tanstack/react-query';

import {
  ILoginCredentials,
  ISession,
  IUserDetailsResponse,
} from '../interfaces/user.interface';

export const useUser = () => {
  const { login, saveUser } = useAuthStore();

  const validateStagingAccess = (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isStagingScope()) {
        const isAllowed = isEmailInActiveStaging(email);

        if (!isAllowed) {
          reject(new Error(STAGING_ACCESS_DENIED_MESSAGE));
          return;
        }
      }

      resolve();
    });
  };

  const authenticateUserMutation = useMutation({
    mutationFn: async ({ username, password }: ILoginCredentials) => {
      await validateStagingAccess(username);

      const userCredential = await signInWithEmailAndPassword(
        authFirebase,
        username,
        password
      );
      return await mapToAuthResponse(userCredential);
    },
    onSuccess: (data: ISession) => {
      login(data, data.token, data.refreshToken);
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const userDetailsMutation = useMutation({
    mutationFn: async () => {
      const data = await httpClient.get<IUserDetailsResponse>(
        authEndpoints.userDetails
      );
      return data;
    },
    onSuccess: (data: IUserDetailsResponse) => {
      if (data) {
        mixpanel.identify(data.user.electrician_id);
        mixpanel.people.set({
          $email: data.user.email,
          $role: data.user.role,
          $technician_id: data.user.electrician_id,
        });
        const mixpanelProps: MixpanelProps = {
          company: data.user.contractor.name || '',
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '',
          platform: 'APP OPS',
          user_id: data.user.electrician_id,
          category: data.user.role,
        };
        saveUser(data, mixpanelProps);
      }
    },
    onError: async (error: Error) => {
      console.error('Error al consultar datos del usuario:', error.message);
    },
  });

  return { authenticateUserMutation, userDetailsMutation };
};
