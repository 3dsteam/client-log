import {createContext, useContext} from 'react';
import {ClientLogContextType} from './models';

/**
 * Define client log components
 */
export const ClientLogContext = createContext<ClientLogContextType>({
    log: () => false
});

export const useClientLogContext = () => useContext(ClientLogContext);