# Client Log

React hook for client-side log saving and server-side synchronization

* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
* [Usage](#usage)
    * [Log Record](#log-record)
    * [Configurations](#configurations)
    * [Example](#example)
* [Playground](#playground)
* [Contacts](#contacts)
* [License](#license)

## Getting Started

### Prerequisites

Before installing the component, you need to check that the *.npmrc* file contains the right registry
so that all requests to install packages will go through **GitHub Packages**.

```text
@3dsteam:registry=https://npm.pkg.github.com
```

You can create the *.npmrc* file in the same directory as your *package.json* file

### Installation

```shell
# Npm
npm install @3dsteam/client-log

# Yarn
yarn add @3dsteam/client-log
```

## Usage

ClientLog includes a ```<ClientLogProvider />``` component, which makes the functions available in all your app

```typescript jsx
import {ClientLogProvider} from '../../src';

// Include provider
<ClientLogProvider>
    <App/>
</ClientLogProvider>
```

Use log function for store a new log

```typescript jsx
import {useClientLogContext} from './context';

// Use React Hook
const {log} = useClientLogContext();
```

### Log Record

```typescript jsx
type Log = {
    /**
     * UUID log
     */
    uuid: string
    /**
     * UUID logs linked to a single logic cycle
     */
    trace: string
    /**
     * Log level
     */
    level: LogLevel
    /**
     * Model
     * Used for define the content structure
     */
    model?: string
    /**
     * Log message
     */
    message: string
    /**
     * Log dynamic data content
     */
    content?: any
    /**
     * Timestamp (milliseconds)
     */
    timestamp: number
    /**
     * Ref. user
     */
    user?: any
}
```

### Configurations

The ```<ClientLogProvider />``` provides different configurations:

- ``server``: defines server configuration  
  **If not defined**, logs will not be uploaded to the server, so they will be saved only on the local DB

| Prop name | Description                                                                                                    | Type                       | Default      |
|-----------|----------------------------------------------------------------------------------------------------------------|----------------------------|--------------|
| configUrl | Define the REST API URL to download ClientLog configuration<br/>**If undefined**, the request will be disabled | string &#124; undefined    | undefined    |
| logUrl    | Define the REST API URL to upload the saved logs to the server                                                 | string                     | /client-logs |
| headers   | Define request headers for the requests<br/>Es. clientId, secret, authorization                                | { [key: string]: string }  | undefined    |

- ``configDefault``: override defaults configuration

| Prop name | Description                                                                         | Type                     | Default |
|-----------|-------------------------------------------------------------------------------------|--------------------------|---------|
| sync      | Toggle sync to the server                                                           | boolean &#124; undefined | true    |
| timeout   | Setup timeout for push request (milliseconds)                                       | number &#124; undefined  | 300000  |
| logLevel  | Filter log level (>=)<br/>Logs with a lower logLevel than specified will be ignored | LogLevel                 | 20      | 
| chunkSize | Define the logs array size for the push request                                     | number                   | 10      |

### Example

This is an example of a log creation.

```typescript jsx
import React, {ReactElement} from 'react';
import {useClientLogContext} from './context';
import {LogLevel} from './models';

const MyComponent = () => {

    const createLog = (): ReactElement => {
        // Create log
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
            <p>Create a new log</p>
            <button onClick={createLog}>Create log</button>
        </>
    )
}
```

For more examples, check the _playground_ project

## Playground

Work in progress...

## Contacts

- [Lorenzo Bonatti](www.linkedin.com/in/lorenzobonatti)

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details