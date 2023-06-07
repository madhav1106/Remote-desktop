import { Socket } from "socket.io";

interface IMouseClick{
    remoteId: string,
    button: {
        button: string,
        double: boolean
    }
}

export const remoteHandler = (socket: Socket) => {
    const joinServer = (deviceId: string) => {
        socket.join(deviceId)
    };

    const mouseMove = ({remoteId, move}: {remoteId: string, move: any}) => {
        socket.to(remoteId).emit('mouse_move', move);
    }

    const mouseClick = ({remoteId, button}: IMouseClick) => {
        socket.to(remoteId).emit('mouse_click', button);
    }

    const mouseScroll = ({remoteId, delta}: {remoteId: string, delta: any}) => {
        socket.to(remoteId).emit('mouse_scroll', delta);
    }

    const mouseDrag = ({remoteId, move}: {remoteId: string, move: any}) => {
        socket.to(remoteId).emit('mouse_drag', move);
    }

    const keyboard = ({remoteId, key}: {remoteId: string, key: string[]}) => {
        socket.to(remoteId).emit('keyboard', key);
    }

    const stopSharing = (deviceId: string) => {
        socket.to(deviceId).emit('stop_sharing');
    }

    const stopRemote = (deviceId: string) => {
        socket.to(deviceId).emit('stop_remote');
    }

    socket.on("join-server", joinServer)
    socket.on("mouse-move", mouseMove)
    socket.on("mouse-click", mouseClick)
    socket.on("mouse-scroll", mouseScroll)
    socket.on("mouse-drag", mouseDrag)
    socket.on("keyboard-event", keyboard)
    socket.on("stop-sharing", stopSharing)
    socket.on("stop-remote", stopRemote)
}