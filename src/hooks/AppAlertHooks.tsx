// hooks/useAppAlert.ts
import { useState, useCallback } from 'react';

interface AlertState {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
}

export const useAppAlert = () => {
    const [alertState, setAlertState] = useState<AlertState>({
        message: '',
        type: 'success', // default to success
        isVisible: false,
    });

    const showAlert = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setAlertState({ message, type, isVisible: true });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState((prevState) => ({ ...prevState, isVisible: false, message: '' }));
    }, []);

    const showError = useCallback((message: string) => {
        showAlert(message, 'error');
    }, [showAlert]);

    return {
        alertState,
        showAlert,
        showError,
        hideAlert,
    };
};
