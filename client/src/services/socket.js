import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002'

let socket = null

export const connectSocket = () => {
    const token = localStorage.getItem('token')

    if (!token) {
        return null
    }

    if (!socket) {
        socket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: false,
        })
    } else {
        socket.auth = { token }
    }

    if (!socket.connected) {
        socket.connect()
    }

    return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
    if (!socket) {
        return
    }

    socket.removeAllListeners()
    socket.disconnect()
    socket = null
}