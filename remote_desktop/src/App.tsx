import './App.css';
import { useContext, useEffect, useRef, useState} from 'react'
import { UserContext } from './context/UserContext';
import { ws } from "./ws";
import { MediaConnection }from "peerjs"

declare global {
  interface Window {
    electronAPI? : any
  }
}
function App() {
  const {userId, remoteId, peer, loading, setRemoteId} = useContext(UserContext);
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [remoteConnecting, setRemoteConnecting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [stream, setStream] = useState<boolean>(false);
  const [isDrag, setIsDrag] = useState<boolean>(false);
  const [isShare, setIsShare] = useState<boolean>(false);
  const [callInfo, setCallInfo] = useState<MediaConnection>();
  const [peerInfo, setPeerInfo] = useState<MediaConnection>();
  const [screen, setScreen] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    window.electronAPI.getScreen((event: any, screen: any) => {
      setScreen(screen);
    })

    ws.on('mouse_move', ({clientX, clientY, clientWidth, clientHeight}) => {
      window.electronAPI.mouseMove({clientX, clientY, clientWidth, clientHeight})
    })

    ws.on('mouse_click', (button) => {
      window.electronAPI.mouseClick(button)
    })
    
    ws.on('mouse_scroll', ({deltaX, deltaY}) => {
      window.electronAPI.mouseScroll({deltaX, deltaY})
    })

    ws.on('mouse_drag', ({direction, clientX, clientY, clientWidth, clientHeight}) => {
      window.electronAPI.mouseDrag({direction, clientX, clientY, clientWidth, clientHeight})
    })

    ws.on('keyboard', (key) => {
      window.electronAPI.keyPress(key)
    })

    ws.on('stop_sharing', async () => {
      await removeTrack();
      setStream(false);
      setRemoteConnecting(false);
    })

    ws.on('stop_remote', () => {
      setIsShare(false);
    })

    return () => {
      ws.off("mouse_move");
      ws.off("mouse_click");
      ws.off('mouse_scroll');
      ws.off('mouse_drag');
      ws.off("keyboard");
      ws.off('stop_sharing');
      ws.off('stop_remote');
    };
  }, [])

  useEffect(() => {
    if(loading) {
      peer?.on('call', (peerInfo) => {
        setShowModal(true);
        setPeerInfo(peerInfo);
      })
    }
  }, [loading, peer])

  useEffect(() => {
    callInfo?.on("stream", async (remoteStream: MediaStream) => {
      setStream(true);
      setRemoteConnecting(false);
      const videoEle = videoRef.current;
      if(videoEle != null) {
        videoEle.srcObject = remoteStream;
        videoEle.play();
      }
    }).on("close", () => {
      setStream(false);
      ws.emit('stop-remote', remoteId)
    }).on('error', () => {
      setStream(false);
      ws.emit('stop-remote', remoteId)
    });
  }, [callInfo, remoteId])

  const removeTrack = () => {
    return new Promise((resolve, reject) => {
      try {
        const videoEle = videoRef.current;
        if(videoEle != null) {
          const mediaStream: any = videoEle.srcObject;
          mediaStream.getTracks().forEach((track: any) => {
            track.stop();
            mediaStream.removeTrack(track);
          })
          resolve(true)
        }
      } catch(e) {
        resolve(false)
      }
    })
  }

  const remoteRequest = () => {
    if (!remoteId || remoteId.length < 6) {
      setErrorMsg("Invalid remote id");
      return;
    } else if (!remoteId.match(/^\d+$/)) {
      setErrorMsg("Remote ID cannot be a string.");
      return;
    } else if (parseInt(remoteId) === parseInt(userId)) {
      setErrorMsg("You can't remote your system.");
      return;
    }
    setErrorMsg('');
    setRemoteConnecting(true);
    (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: screen
        }
      }
    }).then((mediaStream: MediaStream) => {
      const call = peer?.call(remoteId, mediaStream);
      setCallInfo(call)
    })
  }

  const shareScreen = () => {
    (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: screen
        }
      }
    }).then((stream: MediaStream) => {
      const remotesId = peerInfo?.peer;
      setShowModal(false)
      setIsShare(true)
      peerInfo?.answer(stream)
      peerInfo?.on('close', () => {
        ws.emit('stop-sharing', remotesId)
        setIsShare(false)
      }).on('error', () => {
        setIsShare(false)
        ws.emit('stop-sharing', remotesId)
      })
    })
  }

  const cancelRequest = () => {
    if(!showModal) return
    (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: screen
        }
      }
    }).then((stream: MediaStream) => {
      const remotesId = peerInfo?.peer;
      peerInfo?.answer(stream)
      setShowModal(false);
      setTimeout(() => {
        peerInfo?.close();
      }, 30)
      peerInfo?.on('close', () => {
        ws.emit('stop-sharing', remotesId)
      }).on('error', () => {
        ws.emit('stop-sharing', remotesId)
      })
    });
  }

  const stopSharing = () => {
    setIsShare(false);
    peerInfo?.close();
  }

  const stopRemote = () => {
    setStream(false);
    callInfo?.close();
  }

  const handleMouseMove = (e: any) => {
    if(isDrag) {
      ws.emit('mouse-drag',{
        remoteId: remoteId,
        move: {
          direction: "down",
          clientX: e.clientX - e.target.offsetLeft,
          clientY: e.clientY - e.target.offsetTop,
          clientWidth: e.target.clientWidth,
          clientHeight: e.target.clientHeight
        }
      })
    } else{
      ws.emit('mouse-move',{
        remoteId: remoteId,
        move: {
          clientX: e.clientX - e.target.offsetLeft,
          clientY: e.clientY - e.target.offsetTop - 56,
          clientWidth: e.target.clientWidth,
          clientHeight: e.target.clientHeight
        }
      })
    }
  }

  const handleMouseDown = (e: any) => {
    setIsDrag(true)
    const button = e.buttons === 2 ? "right" : (e.buttons === 4 ? "middle" : "left");
    ws.emit('mouse-click', {remoteId, button: {button, double: e.detail === 2 ? true : false}})
  }

  const handleMouseUp = (e: any) => {
    setIsDrag(false)
    ws.emit('mouse-drag',{
      remoteId: remoteId,
      move: {
        direction: "up",
        clientX: e.clientX - e.target.offsetLeft,
        clientY: e.clientY - e.target.offsetTop,
        clientWidth: e.target.clientWidth,
        clientHeight: e.target.clientHeight
      }
    })
  }

  const handleMouseScroll = (e: any) => {
    ws.emit('mouse-scroll', {remoteId, delta: {deltaX: e.deltaX, deltaY: e.deltaY}})
  }

  const handleKeyDown = (e: any) => {
      let mainKey = '', secondKey: any = [];
      e.shiftKey && secondKey.push("shift")
      e.ctrlKey && secondKey.push("command")
      e.altKey && secondKey.push("alt")
      
      if(e.key === "Backspace" || e.key === "Delete" || e.key === "Enter" || e.key === "Tab" || e.key === "Escape"
       || e.key === "Home" || e.key === "End" || e.key === "PageUp" || e.key === "PageDown" || e.key === "F1" || e.key === "F2"
       || e.key === "F3" || e.key === "F4" || e.key === "F5" || e.key === "F6" || e.key === "F7" || e.key === "F8" || e.key === "F9"
       || e.key === "F10" || e.key === "F11" || e.key === "F12" || e.key === "Control" || e.key === "Alt") {
        mainKey = e.key.toLowerCase()
      }
       else if(e.key === "ArrowUp") {
        mainKey = "up"
      } else if(e.key === "ArrowDown") {
        mainKey = "down"
      } else if(e.key === "ArrowLeft") {
        mainKey = "left"
      } else if(e.key === "ArrowRight") {
        mainKey = "right"
      } else if(e.key === " ") {
        mainKey = "space"
      } else if(e.key === "Meta") {
        mainKey = "command"
      } else {
        mainKey = e.key.toLowerCase()
      }
      ws.emit('keyboard-event', {remoteId, key: [mainKey, secondKey]})
  }

  return (
    <>
      {(!stream && !isShare) &&
      <div className="App flex items-center justify-center w-screen h-screen">
        <div className='w-1/4'>
          <label>Your remote id: {userId}</label>
          <input type='number' className="border rounded-md p-2 h-10 my-2 w-full" value={remoteId} placeholder="Remote connection id" onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} onChange={e => setRemoteId(e.target.value)}/>
          {errorMsg && <div className='text-red-500 text-left'>{errorMsg}</div>}
          <button className='w-full rounded-md py-2 my-2 bg-[#22c55e] hover:bg-[#16a34a] text-white' onClick={remoteRequest} disabled={remoteConnecting}>
            {remoteConnecting? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>}
      {isShare &&
        <div className='App flex items-center justify-center w-screen h-screen'>
          <div className='w-1/4'>
            <button className='w-full rounded-md py-2 my-2 bg-[#ef4444] hover:bg-[#dc2626] text-white' onClick={stopSharing}>Stop Screen Share</button>
          </div>
        </div>
      }
      {stream && 
        <div className='App flex items-center justify-center w-screen'>
          <div className='w-1/4'>
            <button className='w-full rounded-md py-2 my-2 bg-[#ef4444] hover:bg-[#dc2626] text-white' onClick={stopRemote}>Stop Remote</button>
          </div>
        </div>
      }
      <div
          style={{
            position: 'relative',
            display: 'flex',
            backgroundColor: '#e2e2e2',
            minHeight: stream ? 'calc(100% - 56px)' : '0',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            zIndex: 1
            // cursor: 'none'
          }}
        >
        <video ref={videoRef}  style={{position: 'absolute', maxHeight: '100%', maxWidth: '100%', outline: '0 !important'}} tabIndex={-1}
          controls={false}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleMouseScroll}
          onKeyDown={handleKeyDown}/>
      </div>
      
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                  <h2 className="text-2xl font-semibold">
                    Incoming Connection
                  </h2>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <p className="my-4 text-slate-500 text-lg leading-relaxed">
                  <span className="font-semibold">{peerInfo?.peer}</span> is waiting for you to accept the request.
                    {/* Waiting for you to accept the request. */}
                  </p>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={cancelRequest}
                  >
                    Decline
                  </button>
                  <button
                    className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={shareScreen}
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>


  );
}

export default App;
