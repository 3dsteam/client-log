import React from 'react'
import ReactDOM from 'react-dom/client'
import {App} from './App'
import {ClientLogProvider} from '../../src';
import {LogLevel} from '../../src/lib/models';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ClientLogProvider
        server={{
            logUrl: 'https://devel.pollinisrl.it/api/v2/client-logs',
            headers: {
                'client-id': '77f18b5eaa59b7d3bbdfc056b7d108e5',
                'secret': '79b5633feaef9e164a6632be041d45934394c78599042aa706656bd16cef33c5cc1304bd06fb36e17299c888475db631760dc02306f0fca819fdfa78d509cf7e'
            }
        }}
        configDefault={{
            sync: true,
            logLevel: LogLevel.INFO,
            timeout: 1000 * 60,
            chunkSize: 1
        }}
    >
        <App/>
    </ClientLogProvider>
)
