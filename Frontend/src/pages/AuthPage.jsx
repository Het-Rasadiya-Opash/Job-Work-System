import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { useAuth } from "../context/AuthContext";
import apiRequest from "../utils/ApiRequest";

const initialSignup = { username: "", email: "", password: "" };
const initialSignin = { email: "", password: "" };

export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const theme = useTheme();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState(initialSignin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggle = () => { setIsSignup((p) => !p); setForm(isSignup ? initialSignin : initialSignup); setError(""); };
  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await apiRequest.post(isSignup ? "/user/signup" : "/user/signin", form);
      setUser(res.data.data);
      navigate("/dashboard");
    } catch (err) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#F9FAFB",
      fontSize: "13.5px",
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main, borderWidth: "1.5px" },
      "&.Mui-focused": { backgroundColor: theme.palette.background.paper },
    },
    "& .MuiInputBase-input::placeholder": { opacity: 0.5, fontSize: "13px" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: theme.palette.background.default,
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 4 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: "8px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Typography fontSize="12px" fontWeight={800} color="#fff">JW</Typography>
          </Box>
          <Typography fontSize="16px" fontWeight={700} color="text.primary" letterSpacing="-0.02em">
            JobWork
          </Typography>
        </Box>

        {/* Card */}
        <Paper sx={{ borderRadius: "12px", overflow: "hidden" }}>

          {/* Heading */}
          <Box sx={{ px: 3, pt: 3, pb: 0 }}>
            <Typography variant="h3" color="text.primary">
              {isSignup ? "Create an account" : "Sign in"}
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={0.5}>
              {isSignup ? "Get started with JobWork" : "Welcome back to JobWork"}
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 2 }}>

            {error && <Alert severity="error">{error}</Alert>}

            {isSignup && (
              <TextField
                name="username" value={form.username || ""} onChange={handleChange}
                placeholder="Username" required fullWidth sx={inputSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
              />
            )}

            <TextField
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Email address" required fullWidth sx={inputSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
            />

            <TextField
              name="password" type={showPassword ? "text" : "password"}
              value={form.password} onChange={handleChange}
              placeholder={isSignup ? "Create a password" : "Password"} required fullWidth sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((p) => !p)} edge="end" tabIndex={-1} sx={{ color: "text.disabled" }}>
                      {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 0.5, py: "9px" }}>
              {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : isSignup ? "Create Account" : "Sign In"}
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <Box
                component="span" onClick={toggle}
                sx={{ color: "primary.main", fontWeight: 600, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
              >
                {isSignup ? "Sign in" : "Sign up"}
              </Box>
            </Typography>
          </Box>
        </Paper>

        <Typography variant="caption" color="text.disabled" textAlign="center" display="block" mt={3}>
          © 2026 JobWork · Built for embroidery businesses
        </Typography>
      </Box>
    </Box>
  );
}
