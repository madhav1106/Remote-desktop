import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export const NameInput: React.FC = () => {
    const { remoteId, setRemoteId } = useContext(UserContext);
    
    return (
        <input
            className="border rounded-md p-2 h-10 my-2 w-full"
            placeholder="Enter your name"
            onChange={(e) => setRemoteId(e.target.value)}
            value={remoteId}
        />
    );
};