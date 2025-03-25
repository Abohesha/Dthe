import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Bell, Home, LogOut, User, Users, MessageCircle } from 'lucide-react'; // Import MessageCircle for chat

const Navbar = () => {
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Set up navigate function for routing

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => axiosInstance.get('/notifications'),
    enabled: !!authUser,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ['connectionRequests'],
    queryFn: async () => axiosInstance.get('/connections/requests'),
    enabled: !!authUser,
  });

  const { mutate: logout } = useMutation({
    mutationFn: () => axiosInstance.post('/auth/logout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });

  const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;
  const unreadConnectionRequestsCount = connectionRequests?.data?.length;

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening chat page
  const handleChatClick = () => {
    navigate('/chat'); // Modify this URL to open the chat page
  };

  return (
    <nav className="bg-secondary shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img className="h-8 rounded" src="/small-logo.png" alt="LinkedIn" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search users"
                className="input input-bordered w-64 px-3 py-2 rounded-full"
              />
              <button onClick={handleSearch} className="absolute right-2 top-2 bg-primary text-white rounded-full px-3 py-1">
                {isLoading ? '...' : 'Search'}
              </button>

              {/* Display search results */}
              {searchResults.length > 0 && (
                <ul className="absolute mt-2 bg-white w-full rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <li key={user._id} className="p-2 border-b hover:bg-gray-200 cursor-pointer">
                      <Link to={`/profile/${user.username}`}>{user.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {authUser ? (
              <>
                <Link to="/" className="text-neutral flex flex-col items-center">
                  <Home size={20} />
                  <span className="text-xs hidden md:block">Home</span>
                </Link>
                <Link to="/network" className="text-neutral flex flex-col items-center relative">
                  <Users size={20} />
                  <span className="text-xs hidden md:block">My Network</span>
                  {unreadConnectionRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">
                      {unreadConnectionRequestsCount}
                    </span>
                  )}
                </Link>
                <Link to="/notifications" className="text-neutral flex flex-col items-center relative">
                  <Bell size={20} />
                  <span className="text-xs hidden md:block">Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Link>
                <Link to={`/profile/${authUser.username}`} className="text-neutral flex flex-col items-center">
                  <User size={20} />
                  <span className="text-xs hidden md:block">Me</span>
                </Link>

                {/* Chat Button */}
                <button
                  onClick={handleChatClick}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <MessageCircle size={20} />
                  <span className="hidden md:inline">Chat</span>
                </button>

                <button
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => logout()}
                >
                  <LogOut size={20} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="bg-pink-500 btn btn-primary">
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
