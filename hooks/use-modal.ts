import { create } from 'zustand';

type ModalType = 'alert' | 'confirm' | 'quota';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  onConfirm?: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showQuotaAlert: () => void;
  closeModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'alert',
  
  showAlert: (title, message) => 
    set({ isOpen: true, title, message, type: 'alert', onConfirm: undefined }),
    
  showConfirm: (title, message, onConfirm) => 
    set({ isOpen: true, title, message, type: 'confirm', onConfirm }),
    
  showQuotaAlert: () => 
    set({
      isOpen: true,
      title: "Limit AI Harian Tercapai 🚀",
      message: "Nexa menggunakan sistem AI gratis yang memiliki batas harian. Bantu kami meng-upgrade server agar fitur AI ini bisa terus dinikmati tanpa batas!",
      type: 'quota',
      onConfirm: undefined
    }),
    
  closeModal: () => set({ isOpen: false }),
}));