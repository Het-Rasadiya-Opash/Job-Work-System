import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import MenuIcon from "@mui/icons-material/Menu";

import { useAuth } from "../context/AuthContext";
import { ColorModeContext } from "../theme/theme";
import apiRequest from "../utils/ApiRequest";

export default function Navbar({ firms = [], activeFirm = null, onFirmChange, onMenuClick }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDark = theme.palette.mode === "dark";

  const [firmAnchor, setFirmAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const handleLogout = async () => {
    await apiRequest.post("/user/logout");
    setUser(null);
    setProfileAnchor(null);
    navigate("/auth");
  };

  const displayFirm = activeFirm?.firm_name || "Select Firm";
  const userInitial = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ gap: 0.75, minHeight: { xs: 52, md: 56 }, px: { xs: 1.5, sm: 2 } }}>

        {/* Mobile menu */}
        {onMenuClick && (
          <IconButton onClick={onMenuClick} sx={{ display: { md: "none" }, color: theme.palette.text.primary, mr: 0.5 }}>
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1.5, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          <Box sx={{
            width: 28, height: 28, borderRadius: "7px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Typography fontSize="11px" fontWeight={800} color="#fff" lineHeight={1}>JW</Typography>
          </Box>
          <Typography
            fontSize="14px" fontWeight={700} color="text.primary" letterSpacing="-0.02em"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            JobWork
          </Typography>
        </Box>

        {/* Divider */}
        <Box sx={{ width: "1px", height: 20, backgroundColor: theme.palette.divider, mx: 0.5, display: { xs: "none", sm: "block" } }} />

        {/* Firm Selector — Linear/Vercel style */}
        <Button
          onClick={(e) => setFirmAnchor(e.currentTarget)}
          startIcon={activeFirm?.logo_url ? (
            <Avatar src={activeFirm.logo_url} sx={{ width: 18, height: 18, borderRadius: "4px" }} variant="rounded" />
          ) : (
            <BusinessOutlinedIcon sx={{ fontSize: "16px!important", opacity: 0.7 }} />
          )}
          endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "16px!important", opacity: 0.5 }} />}
          sx={{
            color: "text.secondary",
            fontWeight: 500,
            fontSize: "13px",
            borderRadius: "6px",
            px: 1.25,
            py: 0.5,
            minWidth: 0,
            maxWidth: { xs: 140, sm: 220 },
            "&:hover": { backgroundColor: theme.palette.action.hover, color: "text.primary" },
            transition: "all 0.15s ease",
            gap: 1,
          }}
        >
          <Typography fontSize="13px" fontWeight={500} noWrap color="inherit">
            {displayFirm}
          </Typography>
        </Button>

        <Menu
          anchorEl={firmAnchor}
          open={Boolean(firmAnchor)}
          onClose={() => setFirmAnchor(null)}
          PaperProps={{ sx: { minWidth: 220 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" color="text.secondary">Firms</Typography>
          </Box>
          {firms.length === 0 ? (
            <MenuItem disabled sx={{ fontSize: "13px" }}>No firms found</MenuItem>
          ) : (
            firms.map((f) => (
              <MenuItem
                key={f._id}
                onClick={() => { onFirmChange?.(f); setFirmAnchor(null); }}
                sx={{
                  display: "flex", justifyContent: "space-between",
                  fontWeight: activeFirm?._id === f._id ? 600 : 400,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {f.logo_url ? (
                    <Avatar src={f.logo_url} sx={{ width: 20, height: 20, borderRadius: "5px" }} variant="rounded" />
                  ) : (
                    <BusinessOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  )}
                  <span>{f.firm_name}</span>
                </Box>
                {activeFirm?._id === f._id && <CheckIcon sx={{ fontSize: 16, color: "primary.main" }} />}
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Dark/Light Mode Toggle */}
        <Tooltip title={isDark ? "Light mode" : "Dark mode"} arrow>
          <IconButton
            onClick={colorMode.toggleColorMode}
            size="small"
            sx={{
              color: "text.secondary",
              borderRadius: "7px",
              width: 32, height: 32,
              "&:hover": { color: "text.primary", backgroundColor: theme.palette.action.hover },
            }}
          >
            {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        {/* Profile Avatar */}
        <Tooltip title="Account" arrow>
          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ p: 0, ml: 0.5 }}>
            <Avatar sx={{
              width: 30, height: 30,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              fontSize: "12px", fontWeight: 700, color: "#fff",
            }}>
              {userInitial}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          PaperProps={{ sx: { minWidth: 220 } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" color="text.primary">{user?.username}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{user?.email}</Typography>
          </Box>
          <Divider />
          <Box sx={{ py: 0.5 }}>
            <MenuItem sx={{ gap: 1.5 }}>
              <PersonOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              Profile
            </MenuItem>
          </Box>
          <Divider />
          <Box sx={{ py: 0.5 }}>
            <MenuItem
              onClick={handleLogout}
              sx={{
                gap: 1.5,
                color: "error.main",
                "&:hover": { backgroundColor: theme.palette.error.light + (isDark ? "" : "33") },
              }}
            >
              <LogoutIcon sx={{ fontSize: 16 }} />
              Log out
            </MenuItem>
          </Box>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}
