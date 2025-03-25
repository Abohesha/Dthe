// frontend/pages/ChatPage.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';

const socket = io('http://localhost:5000'); // Adjust the URL to your server

const ChatPage = () => {
  const { receiverId } = useParams(); // Get receiver's ID from the URL

  // Check if receiverId is undefined
  if (!receiverId) {
    console.error("Receiver ID is undefined");
    return <div>Error: Receiver ID not found.</div>; // Show error if receiverId is undefined
  }

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [receiverData, setReceiverData] = useState(null); // State to store receiver's data

  // Fetch authenticated user information
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        return res.data;
      } catch (err) {
        console.log("Error fetching auth user");
      }
    },
  });

  // Fetch the receiver's information (name, username, etc.)
  const fetchReceiverData = async () => {
    try {
      const response = await axiosInstance.get(`/api/v1/users/${receiverId}`);
      setReceiverData(response.data); // Store the receiver data
    } catch (err) {
      console.error('Error fetching receiver data:', err);
    }
  };

  // Fetch the chat history when the component is mounted
  const fetchChatHistory = async () => {
    if (!authUser || !receiverId) return; // Ensure receiverId and authUser are valid

    try {
      const response = await axiosInstance.get(`/api/v1/messages/${authUser._id}/${receiverId}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  useEffect(() => {
    if (authUser && receiverId) {
      socket.emit('join', authUser._id); // User joins the chat room on socket connection
    }

    socket.on('receive_message', (data) => {
      if (data.receiverId === authUser._id) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    fetchReceiverData(); // Fetch receiver's info when the component mounts
    fetchChatHistory(); // Fetch chat history

    return () => {
      socket.off('receive_message');
    };
  }, [authUser, receiverId]); // Adding `receiverId` to the dependencies

  // Handle sending messages
  const handleSendMessage = () => {
    if (message.trim()) {
      setIsLoading(true);

      socket.emit('send_message', {
        senderId: authUser._id,
        receiverId,
        message,
      });

      // Also update the local state
      setMessages((prevMessages) => [
        ...prevMessages,
        { senderId: authUser._id, message, timestamp: new Date() },
      ]);

      setMessage('');
      setIsLoading(false);
    }
  };

  if (!receiverData) return <div>Loading...</div>; // Show loading until receiver's data is fetched

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="bg-white shadow-lg rounded-lg p-4 h-[500px] flex flex-col">
        {/* Display receiver's name */}
        <h2 className="text-xl font-semibold mb-4">Chat with {receiverData.name}</h2>

        <div className="flex-grow overflow-y-auto mb-4">
          {/* Displaying chat messages */}
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${msg.senderId === authUser._id ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}
              >
                <p className={`text-sm ${msg.senderId === authUser._id ? 'text-right' : 'text-left'}`}>{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="input input-bordered w-full p-3 rounded-l-lg focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="bg-blue-500 text-white p-3 rounded-r-lg ml-2 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
