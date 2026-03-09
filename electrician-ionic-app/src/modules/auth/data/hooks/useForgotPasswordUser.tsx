import { useMutation } from '@tanstack/react-query';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { IForgotPasswordRequest } from '../interfaces/user.interface';

export const useForgotPasswordUser = () => {
  const forgotPasswordUserMutation = useMutation({
    mutationFn: async ({ email }: IForgotPasswordRequest) => {
      const auth = getAuth();
      const sendEmail = await sendPasswordResetEmail(auth, email);

      return sendEmail;
    },
    onSuccess: () => {
      return 'ok';
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  return { forgotPasswordUserMutation };
};
