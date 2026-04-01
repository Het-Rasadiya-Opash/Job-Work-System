import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "../utils/ApiRequest";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFirm, setActiveFirm] = useState(null);
  const [firms, setFirms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Interceptor to handle automatic logout on token expiry
    const interceptor = apiRequest.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          error.config &&
          !error.config.url.includes("/user/signin") &&
          !error.config.url.includes("/user/signup")
        ) {
          setUser(null);
          navigate("/auth");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiRequest.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    apiRequest
      .get("/user/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const refreshFirms = () => {
    apiRequest.get("/company/my-firms")
      .then((res) => {
        const list = res.data.data || [];
        setFirms(list);
        if (list.length > 0) setActiveFirm((prev) => prev ? list.find((f) => f._id === prev._id) || list.find((f) => f.isDefault) || list[0] : list.find((f) => f.isDefault) || list[0]);
        else setActiveFirm(null);
      })
      .catch(() => { });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, activeFirm, setActiveFirm, firms, refreshFirms }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
