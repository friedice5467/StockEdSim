import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

const useSignalR = (url) => {
    const [connection, setConnection] = useState(null);
    const [connectionState, setConnectionState] = useState(HubConnectionState.Disconnected);
    const [error, setError] = useState(null);
    const hasConnected = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const newConnection = new HubConnectionBuilder()
                .withUrl(url, {
                    withCredentials: true,
                    accessTokenFactory: () => token
                })
                .build();

            setConnection(newConnection);
        }
    }, [url]);

    useEffect(() => {
        const startConnection = () => {
            if (connection && connection.state === HubConnectionState.Disconnected) {
                connection.start()
                    .then(() => {
                        hasConnected.current = true;
                        setConnectionState(HubConnectionState.Connected);
                        setError(null);
                    })
                    .catch(err => {
                        setError(err);
                        if (hasConnected.current) {
                            setTimeout(startConnection, 5000);
                        }
                    });
            }
        };

        if (connection) {
            startConnection();

            connection.onclose(err => {
                setConnectionState(HubConnectionState.Disconnected);
                setError(err);
                if (hasConnected.current) {
                    setTimeout(startConnection, 5000);
                }
            });
        }

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [connection]);

    return { connection, connectionState, error };
};

export default useSignalR;
