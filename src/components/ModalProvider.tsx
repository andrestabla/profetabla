'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import StatusModal from './StatusModal';
import ConfirmationModal from './ConfirmationModal';
import PromptModal from './PromptModal';

interface ModalContextType {
    showAlert: (title: string, message: string, type?: 'success' | 'error' | 'warning') => Promise<void>;
    showConfirm: (title: string, message: string, type?: 'warning' | 'danger' | 'info') => Promise<boolean>;
    showPrompt: (title: string, message: string, defaultValue?: string, placeholder?: string) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning'; resolve: () => void } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; type: 'warning' | 'danger' | 'info'; resolve: (value: boolean) => void } | null>(null);
    const [promptState, setPromptState] = useState<{ isOpen: boolean; title: string; message: string; defaultValue?: string; placeholder?: string; resolve: (value: string | null) => void } | null>(null);

    const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        return new Promise<void>((resolve) => {
            setAlertState({ isOpen: true, title, message, type, resolve });
        });
    }, []);

    const showConfirm = useCallback((title: string, message: string, type: 'warning' | 'danger' | 'info' = 'warning') => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({ isOpen: true, title, message, type, resolve });
        });
    }, []);

    const showPrompt = useCallback((title: string, message: string, defaultValue?: string, placeholder?: string) => {
        return new Promise<string | null>((resolve) => {
            setPromptState({ isOpen: true, title, message, defaultValue, placeholder, resolve });
        });
    }, []);

    const handleAlertClose = () => {
        if (alertState) {
            const { resolve } = alertState;
            setAlertState(null); // Clear state first
            resolve();
        }
    };

    const handleConfirmClose = (value: boolean) => {
        if (confirmState) {
            const { resolve } = confirmState;
            setConfirmState(null); // Clear state first
            resolve(value);
        }
    };

    const handlePromptClose = (value: string | null) => {
        if (promptState) {
            const { resolve } = promptState;
            setPromptState(null); // Clear state first
            resolve(value);
        }
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            {alertState && (
                <StatusModal
                    isOpen={alertState.isOpen}
                    onClose={handleAlertClose}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                />
            )}
            {confirmState && (
                <ConfirmationModal
                    isOpen={confirmState.isOpen}
                    onConfirm={() => handleConfirmClose(true)}
                    onCancel={() => handleConfirmClose(false)}
                    title={confirmState.title}
                    message={confirmState.message}
                    type={confirmState.type}
                />
            )}
            {promptState && (
                <PromptModal
                    isOpen={promptState.isOpen}
                    onConfirm={(val) => handlePromptClose(val)}
                    onCancel={() => handlePromptClose(null)}
                    title={promptState.title}
                    message={promptState.message}
                    defaultValue={promptState.defaultValue}
                    placeholder={promptState.placeholder}
                />
            )}
        </ModalContext.Provider>
    );
}

export const useModals = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModals must be used within a ModalProvider');
    return context;
};
