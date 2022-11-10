import React, {ReactElement, Reducer, useCallback, useEffect, useReducer, useState} from 'react';
import {ClientLogContext} from './context';
import {db} from './db';
import {Config, Log, LogLevel, LogType} from './models';
import {liveQuery} from 'dexie';

interface ClientLogProviderProps {
    server?: {
        configUrl?: string
        logUrl: string
        // Headers request
        headers?: { [key: string]: string }
    }
    configDefault?: Config
    children: any
}

/**
 * Define components provider
 * @constructor
 */
export const ClientLogProvider = ({server, configDefault, children}: ClientLogProviderProps): ReactElement => {

    // State
    const [ready, setReady] = useState<boolean>(false);

    /**
     * Config reducer
     */
    type ConfigReducerPayload = { action: 'UPDATE', data: Config };
    const [config, dispatch] = useReducer<Reducer<Config, ConfigReducerPayload>>((prevState, payload) => {
        switch (payload.action) {
            case 'UPDATE':
                // Log to console
                console.groupCollapsed('%c[CLIENT LOG]: %cUpdate config', 'font-weight: bold', 'color: rgb(234 88 12); font-weight: 400');
                console.table({...prevState, ...payload.data});
                console.groupEnd();
                // Set new config
                return {
                    ...prevState,
                    ...payload.data
                }
            default:
                return prevState;
        }
    }, configDefault || {
        sync: true,
        timeout: 1000 * 60 * 5,
        logLevel: LogLevel.INFO,
        chunkSize: 10
    });

    /**
     * Database listeners
     */
    useEffect(() => {
        // Setup database events listeners
        db.on('ready', () => {
            console.debug('%c[CLIENT LOG]: %cReady!', 'font-weight: bold', 'color: rgb(22 163 74); font-weight: 400');
            setReady(true);
        });
    }, []);

    /**
     * Pull config
     * Effettua una chiamata REST per ottenere dal server la lista delle configurazioni
     * e salva la configurazione nel localStorage (key = client-log-config)
     */
    const pullConfig = useCallback(async (): Promise<Config | undefined> => {
        if (!server?.configUrl) {
            // Log to console
            console.debug('%c[CLIENT LOG]: %cServer config not enabled', 'font-weight: bold', 'color: rgb(202 138 4); font-weight: 400');
            return;
        }
        try {
            // Make request
            const res = await fetch(server?.configUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(server?.headers || {})
                }
            });
            // Return config
            if (res.ok) {
                const config = await res.json() as Config;
                // Save into local storage
                localStorage.setItem('client-log-config', JSON.stringify(config));
                return config;
            }
        } catch (e) {
            // Log to console
            console.groupCollapsed('%c[CLIENT LOG]: %cError load config', 'font-weight: bold', 'color: rgb(220 38 38); font-weight: 400');
            console.error(e);
            console.groupEnd();
        }
    }, [server]);

    /**
     * Caricamento configurazioni al primo accesso
     */
    useEffect(() => {
        // Make pull request
        pullConfig().then((config) => {
            if (config) {
                // Update
                dispatch({action: 'UPDATE', data: config});
            }
        })
    }, []);

    /**
     * Sync interval
     * Setta i timer per effettuare le richieste di sync (PULL e PUSH)
     */
    useEffect(() => {
        // Setup PUSH timer
        const pushTimer = setInterval(() => {
            // Check server config
            if (!server.logUrl) return;
            // Sync data
            pushSync(server.logUrl, config, server?.headers).then(() => true);
        }, config.timeout);
        // Setup PULL timer
        const pullTimer = setInterval(() => {
            // Check server config
            if (!server.configUrl) return;
            // Make pull request
            pullConfig().then((config) => {
                if (config) {
                    // Update
                    dispatch({action: 'UPDATE', data: config});
                }
            });
        }, 1000 * 60 * 15);
        // Clean timers on exit
        return () => {
            clearInterval(pushTimer);
            clearInterval(pullTimer);
        }
    }, [server, config]);

    /**
     * Live sync
     * Effettua la chiamata di sync quando viene rilevato un nuovo record
     *
     * Tabelle
     * - logs
     */
    useEffect(() => {
        // Subscribe to logs
        const liveLogs = liveQuery(() => db.logs.orderBy('timestamp').toArray()).subscribe({
            next: () => pushSync(server?.logUrl, config, server?.headers).then(() => true)
        });
        // Clean subscribes
        return () => {
            liveLogs.unsubscribe();
        }
    }, [server, config]);

    /**
     * Log
     * Creazione nuovo record all'interno del database
     */
    const log = useCallback(async (data: Log, type: LogType = LogType.LOG) => {
        if (!ready) {
            console.warn('%c[CLIENT LOG]: %cDatabase not ready', 'font-weight: bold', 'font-weight: 400');
            return;
        }
        // Create new log
        createLog(data, type, config)
            .then((recordId) => {
                // Check if record created
                if (recordId) {
                    // Log to console
                    console.groupCollapsed('%c[CLIENT LOG]: %cNew record', 'font-weight: 700', 'color: rgb(37 99 235); font-weight: 400');
                    console.log('Type:', type);
                    console.table(data);
                    console.groupEnd();
                }
            })
            .catch((e: unknown) => {
                // Log to console
                console.groupCollapsed('%c[CLIENT LOG]: %cError record creation', 'font-weight: bold', 'color: rgb(220 38 38); font-weight: 400');
                console.log('Type:', type);
                console.table(data);
                console.error(e);
                console.groupEnd();
            });
    }, [ready, config]);

    return (
        <ClientLogContext.Provider value={{log}}>
            {children}
        </ClientLogContext.Provider>
    )
}

/**
 * Is in sync?
 * Toggle che identifica una sync in corso
 */
let isInSync: boolean = false;

/**
 * Sync (PUSH)
 * Sincronizza i dati dal client al server
 *
 * Tabelle sincronizzate
 * - logs
 *
 * L'operazione di sync non avviene
 * se presente un'altra operazione di sync pendente (isInSync = true)
 */
const pushSync = async (logUrl: string | undefined, config: Config, headers: { [key: string]: string } | undefined) => {
    if (isInSync) return;

    // Check if sync is disabled
    if (!config.sync) {
        // Log in console
        console.groupCollapsed('%c[CLIENT LOG]: %cSync is disabled', 'font-weight: bold', 'color: rgb(202 138 4); font-weight: 400');
        console.table(config);
        console.groupEnd();
        return;
    } else if (!logUrl) {
        // Log to console
        console.debug('%c[CLIENT LOG]: %cLog push endpoint is not defined', 'font-weight: bold', 'color: rgb(202 138 4); font-weight: 400');
        return;
    }

    // Toggle sync flag
    isInSync = true;

    // Get current tables lists
    let isRecordsEmpty: boolean = true;
    const records = {
        logs: await db.logs.orderBy('timestamp').toArray(l => {
            isRecordsEmpty = false;
            // Get record
            return l;
        })
    };
    // Check if there are no records
    if (isRecordsEmpty) {
        // Toggle sync flag
        isInSync = false;
        return;
    }

    // Create requests promise
    const requests: Promise<void>[] = [];

    // Each specific records
    if (records.logs.length) {
        // Chunk list
        const chunks = chunkRecords(records.logs, config.chunkSize) as Log[][];
        // Each logs chunks
        for (const logs of chunks) {
            // Add sync request
            requests.push(
                // Add request
                new Promise(async (resolve) => {
                    try {
                        // Call REST API
                        const res = await fetch(logUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(headers || {})
                            },
                            body: JSON.stringify(logs[0]) // @TODO To fix in production version
                        });
                        // Check if all ok
                        if (res.ok) {
                            // Cleanup records
                            await db.logs.bulkDelete(logs.map(l => l.uuid));
                        }
                    } finally {
                        // Terminate request
                        resolve();
                    }
                })
            );
        }
    }

    // Wait all request are synced
    await Promise.all(requests);
    // Done
    isInSync = false;
}

/**
 * Create log
 * Crea all'interno del DB un nuovo log record
 *
 * Il record può essere
 * - LOG: aggiunge il record alla tabella di log
 * - CONFIG: aggiunge il record nella tabella delle configurazioni
 * - ANALYTICS: aggiunge il record nella tabella ...
 *
 * @param data - Record da aggiungere
 * @param type - Tipologia di log (record) (default: log)
 * @param config - Configurazione
 */
const createLog = async (data: Log, type: LogType = LogType.LOG, config: Config) => {
    // Check log type
    switch (type) {
        case LogType.LOG:
            // Check config level type
            if (data.level >= config.logLevel) {
                return db.logs.add(data);
            }
            break;
        default:
            console.warn('CLIENT LOG: Log type not found');
    }
}

/**
 * Chunk records
 * Divide una lista in sottoliste più piccole
 * Ritorna la lista delle sottoliste (chunk) generate
 * @param items - Lista items
 * @param chunkSize - Grandezza dei chunk
 */
const chunkRecords = (items: unknown[], chunkSize: number) => {
    const chunks: unknown[][] = [];
    // Each all items
    for (let i = 0; i < items.length; i += chunkSize) {
        // Create chunk and add to list
        chunks.push(items.splice(i, i + chunkSize));
    }
    // Return chunks
    return chunks;
}