import { createContext, useEffect, useState } from "react";
import { ws } from "../ws";
import { Peer }from "peerjs"

interface UserValue {
    userId: string;
    remoteId: string;
    peer: Peer | undefined,
    loading: boolean,
    setRemoteId: (userId: string) => void;
}

interface Props {
    children: React.ReactNode;
}

export const UserContext = createContext<UserValue>({
    userId: "",
    remoteId: "",
    peer: undefined,
    loading: false,
    setRemoteId: (remoteId) => {}
});


export const UserProvider: React.FC<Props> = ({ children }) => {
    const [userId] = useState(Math.floor(Math.random() * 899999 + 100000).toString());
    
    // const [userId] = useState(localStorage.getItem("userId") || Math.floor(Math.random() * 1000000).toString());
    const [remoteId, setRemoteId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [peer, setPeer] = useState<Peer>();

    const peerOptions = {
        // host: "192.168.0.5",
        // port: 9001,
        host: "peer.crossteam.app",
        port: 443,
        path: "/",
        secure: true,
        proxy: true,
        // config: {
        //   iceServers: [
        //     { url: "stun:stun01.sipphone.com" },
        //     { url: "stun:stun.ekiga.net" },
        //     { url: "stun:stunserver.org" },
        //     { url: "stun:stun.softjoys.com" },
        //     { url: "stun:stun.voiparound.com" },
        //     { url: "stun:stun.voipbuster.com" },
        //     { url: "stun:stun.voipstunt.com" },
        //     { url: "stun:stun.voxgratia.org" },
        //     { url: "stun:stun.xten.com" },
        //     {
        //       url: "turn:192.158.29.39:3478?transport=udp",
        //       credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        //       username: "28224511:1379330808",
        //     },
        //     {
        //       url: "turn:192.158.29.39:3478?transport=tcp",
        //       credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        //       username: "28224511:1379330808",
        //     },
        //   ],
        // },
      };

    
    useEffect(() => {
        // ws.emit("connection")
        ws.emit("join-server", userId);
        // localStorage.setItem("userId", userId);
        const peer = new Peer(userId, peerOptions);
        setPeer(peer)
        setLoading(true);
    }, []);

    

    return (
        <UserContext.Provider value={{ userId, remoteId, peer, loading, setRemoteId }}>
            {children}
        </UserContext.Provider>
    );
};