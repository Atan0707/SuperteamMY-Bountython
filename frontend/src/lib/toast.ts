import { toast } from 'sonner';

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#10B981',
      color: 'white',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#EF4444',
      color: 'white',
    },
  });
}; 