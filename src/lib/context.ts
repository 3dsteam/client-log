import {createContext, useContext} from 'react';
import {ClientLogContextType} from './models';

/**
 * Define client log components
 */
export const ClientLogContext = createContext<ClientLogContextType>({
    log: () => false
});

// Export components
export const useClientLogContext = () => useContext(ClientLogContext);