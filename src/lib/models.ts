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
    NOTSET = 0,
    DEBUG = 10,
    INFO = 20,
    WARNING = 30,
    ERROR = 40,
    CRITICAL = 50
}

export enum LogType {
    CONFIG,
    LOG,
    ANALYTICT
}

export type ClientLogContextType = {
    log: (data: Log, type?: LogType) => void
}

export type Config = {
    /**
     * Indica se effettuare la sync dei dati sul server
     */
    sync: boolean
    /**
     * Timeout richiesta di push
     */
    timeout: number
    /**
     * Livello di log da registrare
     */
    logLevel: LogLevel
    /**
     * Dimensione massima dei chunk
     */
    chunkSize: number
}