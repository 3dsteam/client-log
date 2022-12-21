export type Log = {
    /**
     * UUID univoco log
     */
    uuid: string
    /**
     * UUID log correlati
     */
    trace: string
    /**
     * Livello di log
     */
    level: LogLevel
    /**
     * Modello
     * Definisce una struttura del contenuto
     */
    model?: string
    /**
     * Messaggio log
     */
    message: string
    /**
     * Log data content
     */
    content?: any
    /**
     * Timestamp in millisecondi
     */
    timestamp: number
    /**
     * Ref. utente
     */
    user?: any
}

export enum LogLevel {
    NOT_SET = 0,
    DEBUG = 10,
    INFO = 20,
    WARNING = 30,
    ERROR = 40,
    CRITICAL = 50
}

export enum LogType {
    LOG
}

export type ClientLogContextType = {
    log: (data: Log, type?: LogType) => void
}

export type Config = {
    /**
     * Enable server sync
     */
    sync: boolean
    /**
     * Time interval for sync in milliseconds
     */
    timeout: number
    /**
     * Min log level to save
     */
    logLevel: LogLevel
    /**
     * Chunk size for log list
     */
    chunkSize: number
}

export type ClientLogSettings = {
    /**
     * Default Client log configurations
     */
    config?: Config
    /**
     * Server settings
     * for sync configs and logs
     */
    server?: {
        /**
         * Base url for API requests
         */
        baseUrl?: string
        /**
         * Define headers for the requests
         * Ex. { 'Authorization': 'Bearer ...' }
         */
        headers?: { [key: string]: string }
        /**
         * Settings for sync client log configurations.
         * View README for defaults info
         */
        configSync?: {
            /**
             * Enable config sync
             */
            enabled?: boolean
            /**
             * Endpoint API
             * This use the fetch api documented into README
             */
            api?: string
            /**
             * Use custom fetch function
             */
            request?: () => Promise<any>
            /**
             * Use custom response handler
             * @param response
             */
            parseResponse?: (response: any) => Config
        }
        /**
         * Settings for sync logs.
         * View README for defaults info
         */
        logSync?: {
            /**
             * Endpoint API
             * This use the fetch api documented into README
             */
            api?: string
            /**
             * Use custom fetch function
             */
            request?: (logs: Log[]) => Promise<any>
        }
    }
}