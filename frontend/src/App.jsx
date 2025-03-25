import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios";
import NotificationsPage from "./pages/NotificationsPage";
import NetworkPage from "./pages/NetworkPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./components/ChatPage"; // Make sure ChatPage component is correctly imported

function App() {
  const { data: authUser, isLoading, isError } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          return null; // Redirect to login if 401 (unauthorized)
        }
        toast.error(err.response?.data?.message || "Something went wrong");
        throw new Error("Authentication error");
      }
    },
  });

  if (isLoading) return <div>Loading...</div>;

  if (isError) {
    return <div>Error loading authentication info. Please try again later.</div>;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to="/login" />} />
        <Route path="/network" element={authUser ? <NetworkPage /> : <Navigate to="/login" />} />
        <Route path="/post/:postId" element={authUser ? <PostPage /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/chat/:receiverId" element={<ChatPage />} />
      </Routes>
      <Toaster />
    </Layout>
  );
}

export default App;
