import {ReactElement} from 'react';
import {useClientLogContext} from '../../src/lib/context';
import {LogLevel} from '../../src/lib/models';

export const App = (): ReactElement => {

    // Import log function
    const {log} = useClientLogContext();

    const createLog = () => {
        log({
            uuid: 'UUID' + Date.now(),
            trace: 'TRACE' + Date.now(),
            message: 'Log Playground',
            content: {
                a: 'Lorem ipsum',
                b: 'This is a dynamic content'
            },
            level: LogLevel.INFO,
            timestamp: Date.now()
        });
    }

    return (
        <>
            <h1>Hi! Welcome to ClientLog Playground!</h1>
            <hr/>
            <p>Create a new log</p>
            <button onClick={createLog}>Create log</button>
        </>
    )
}