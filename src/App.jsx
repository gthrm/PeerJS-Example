/* eslint-disable jsx-a11y/media-has-caption */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import Peer from 'peerjs';

const peer = new Peer(new Date().getTime());

const getId = () => new Date().getTime();

function App() {
  const [peerData, setPeerData] = useState({
    myId: '',
    friendId: '',
    message: '',
    messages: [],
  });
  const myVideo = useRef(null);
  const friendVideo = useRef(null);
  const connection = useRef(null);

  const handleSend = useCallback(() => {
    const msgObj = {
      id: getId(),
      sender: peerData.myId,
      message: peerData.message,
    };

    connection.current.send(msgObj);
    setPeerData((prev) => ({
      ...prev,
      messages: [...prev.messages, msgObj],
      message: '',
    }));
  }, [peerData.message, peerData.myId]);

  const handleVideoCall = useCallback(() => {
    const getUserMedia = navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia;

    getUserMedia({ video: true, audio: true }, (stream) => {
      myVideo.current.srcObject = stream;
      myVideo.current?.play();

      const call = peer.call(peerData?.friendId, stream);

      call.on('stream', (remoteStream) => {
        friendVideo.current.srcObject = remoteStream;
        friendVideo.current?.play();
      });
    });
  }, [peerData?.friendId]);

  useEffect(() => {
    peer.on('open', (id) => {
      console.log('useEffect open id', id);
      setPeerData((prev) => ({ ...prev, myId: id }));
    });

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        setPeerData((prev) => ({
          ...prev,
          messages: [...prev.messages, { ...data, id: getId() }],
        }));
      });
    });

    peer.on('call', (call) => {
      const getUserMedia = navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia;

      getUserMedia({ video: true, audio: true }, (stream) => {
        myVideo.current.srcObject = stream;
        myVideo.current?.play();

        call.answer(stream);

        call.on('stream', (remoteStream) => {
          friendVideo.current.srcObject = remoteStream;
          friendVideo.current?.play();
        });
      });
    });
  }, []);

  const handleChangeMessage = (e) => {
    setPeerData((prev) => ({ ...prev, message: e.target.value }));
  };

  const handleChangeFriendId = (e) => {
    setPeerData((prev) => ({ ...prev, friendId: e.target.value }));
  };

  useEffect(() => {
    if (peerData.friendId) {
      connection.current = peer.connect(peerData.friendId);
    }
  }, [peerData.friendId]);

  return (
    <div className="wrapper">
      <div className="col">
        <h1>
          My ID:
          {peerData.myId}
        </h1>

        <label htmlFor="friendId">
          Friend ID:
          <input
            id="friendId"
            type="text"
            defaultValue={peerData.friendId}
            onChange={handleChangeFriendId}
          />
        </label>
        <br />
        <br />

        <label htmlFor="message">
          Message:
          <input
            id="message"
            type="text"
            value={peerData.message}
            onChange={handleChangeMessage}
          />
        </label>
        <button type="button" onClick={handleSend}>
          Send
        </button>

        <button type="button" onClick={handleVideoCall}>
          Video Call
        </button>
        {peerData.messages.map((message) => (
          <div key={message.id + message.message}>
            <h3>
              {message.sender}
              :
            </h3>
            <p>{message.message}</p>
          </div>
        ))}
      </div>

      <div className="col">
        <div>
          <video ref={myVideo} />
        </div>
        <div>
          <video ref={friendVideo} />
        </div>
      </div>
    </div>
  );
}

export default App;
