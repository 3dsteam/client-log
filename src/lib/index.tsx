import React, {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {ClientLogSettings, Config, Log, LogLevel, LogType} from './models';
import {ClientLogContext} from './context';
import {liveQuery} from 'dexie';
import {db} from './db';

/**
 * Chunk records
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

interface ClientLogProviderProps {
    /**
     * Client log settings
     */
    settings?: ClientLogSettings
    /**
     * Content
     */
    children: ReactElement
}

/**
 * Define components provider
 * @constructor
 */
export const ClientLogProvider = ({settings, children}: ClientLogProviderProps): ReactElement => {

    // Flag sync in progress
    const isInSync = useRef(false);

    // Provider ready state
    const [ready, setReady] = useState<boolean>(false);

    // Configuration
    const [config, setConfig] = useState<Config>(settings?.config || {
        sync: true,
        timeout: 1000 * 60 * 5,
        logLevel: LogLevel.INFO,
        chunkSize: 10
    });

    /**
     * Database listeners
     * Check when database is ready
     */
    useEffect(() => {
        // Setup database events listeners
        db.on('ready', () => {
            console.debug('[CLIENT LOG]: Ready!');
            // Ready!
            setReady(true);
        });
    }, []);

    /**
     * Get config from server
     * Sync the client log configuration from server
     */
    const getConfigFromServer = useCallback(async (): Promise<Config | undefined> => {
        // Check if sync is disabled
        if (!settings?.server?.configSync?.enabled) {
            // Log to console
            console.debug('[CLIENT LOG]: Server config not enabled');
            return;
        }
        // Get server settings
        const server = settings.server;
        // Sync configurations
        try {
            let response: Response;
            // Check if there is a custom fetch function
            if (server.configSync.request) {
                // Use custom fetch function
                response = await server.configSync.request();
            } else {
                // Prepare endpoint
                const baseUrl = server.baseUrl || '/api';
                const api = server.configSync.api || '/client-log/configs';
                // Make default request
                response = await fetch(baseUrl + api, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(server.headers || {})
                    }
                });
            }
            // Check response
            if (response.ok) {
                const json = await response.json();
                let config: Config;
                // Check if there is a custom parse function
                if (server.configSync.parseResponse) {
                    // Use custom parse function
                    config = server.configSync.parseResponse(json);
                } else {
                    // Use default parse function
                    config = json;
                }
                // Save into local storage
                localStorage.setItem('client-log-config', JSON.stringify(config));
                // Return config
                return config;
            }
        } catch (e) {
            // Log to console
            console.groupCollapsed('[CLIENT LOG]: Error load config');
            console.error(e);
            console.groupEnd();
        }
        return;
    }, [settings?.server]);

    /**
     * Push data to server
     * Sync logs from client log to server
     */
    const pushToServer = useCallback(async () => {
        // Check if sync is already running
        if (isInSync.current) return;
        // Check if sync is disabled
        if (!config.sync) {
            // Log in console
            console.groupCollapsed('[CLIENT LOG]: Sync is disabled');
            console.table(config);
            console.groupEnd();
            return;
        }
        // Get server settings
        const server = settings?.server;
        // Toggle sync flag
        isInSync.current = true;
        // Create requests promise
        const requests: Promise<void>[] = [];
        // Get current tables lists
        const records = {
            logs: await db.logs.orderBy('timestamp').toArray()
        };
        // Each specific records
        if (records.logs.length) {
            // Chunk records
            const chunks = chunkRecords(records.logs, config.chunkSize) as Log[][];
            // Each logs chunks
            for (const logs of chunks) {
                // Add sync request
                requests.push(
                    (async () => {
                        try {
                            let response: Response;
                            // Check if there is a custom fetch function
                            if (server?.logSync?.request) {
                                // Use custom fetch function
                                response = await server.logSync.request(logs);
                            } else {
                                // Prepare endpoint
                                const baseUrl = server?.baseUrl || '/api';
                                const api = server?.logSync.api || '/client-log/logs';
                                // Make default request
                                response = await fetch(baseUrl + api, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(server?.headers || {})
                                    },
                                    body: JSON.stringify(logs)
                                });
                            }
                            // Check if all ok
                            if (response.ok) {
                                // Cleanup records
                                await db.logs.bulkDelete(logs.map(l => l.uuid));
                            }
                        } catch (e) {
                            // Log to console
                            console.groupCollapsed('[CLIENT LOG]: Error push logs');
                            console.error(e);
                            console.groupEnd();
                        }
                    })()
                );
            }
        }
        // Wait all request are synced
        if (requests.length) await Promise.all(requests);
        // Done
        isInSync.current = false;
    }, [config, settings?.server]);

    /**
     * Load client log configurations
     * from remote server at first start
     */
    useEffect(() => {
        // Make pull request
        getConfigFromServer().then((config) => {
            if (config) {
                // Set config
                setConfig(config);
            }
        })
    }, []);

    /**
     * Live sync
     * Check when there are new logs
     * and try sync them to server
     */
    useEffect(() => {
        // Subscribe to logs
        const liveLogs = liveQuery(() => db.logs.orderBy('timestamp').toArray())
            .subscribe({next: pushToServer});
        // Clean subscribes
        return () => {
            liveLogs.unsubscribe();
        }
    }, [pushToServer]);

    /**
     * Sync interval configs
     */
    useEffect(() => {
        // Pull config interval (10 minutes)
        const interval = setInterval(() => {
            // Make pull request
            getConfigFromServer().then((config) => {
                if (config) {
                    // Set config
                    setConfig(config);
                }
            })
        }, 1000 * 60 * 10);
        // Clean interval
        return () => {
            clearInterval(interval);
        }
    }, [getConfigFromServer]);

    /**
     * Sync interval push data
     */
    useEffect(() => {
        // Push data interval
        const interval = setInterval(() => {
            // Make pull request
            pushToServer().then(() => true);
        }, config.timeout);
        // Clean interval
        return () => {
            clearInterval(interval);
        }
    }, [config, pushToServer]);

    /**
     * Save new log into local DB
     */
    const log = useCallback(async (data: Log, type: LogType = LogType.LOG) => {
        // Check if provider is ready
        if (!ready) {
            console.warn('[CLIENT LOG]: Database not ready');
            return;
        }
        // Check log type
        if (type === LogType.LOG) {
            // Check config level type
            if (data.level >= config.logLevel) {
                try {
                    // Save log
                    await db.logs.add(data);
                    // New log created
                    console.groupCollapsed('[CLIENT LOG]: Log created');
                    console.log({type, data});
                    console.groupEnd();
                } catch (e) {
                    // Log to console
                    console.groupCollapsed('[CLIENT LOG]: Error record creation');
                    console.log({type, data});
                    console.error(e);
                    console.groupEnd();
                }
            }
        }
    }, [ready, config]);

    return (
        <ClientLogContext.Provider value={{log}}>
            {children}
        </ClientLogContext.Provider>
    )
}