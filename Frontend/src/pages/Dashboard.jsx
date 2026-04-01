import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const SIDEBAR_FULL = 220;
const SIDEBAR_MINI = 56;
const NAV_H = 56;

const navItems = [
  { label: "Overview", icon: DashboardOutlinedIcon, path: "/dashboard" },
  { label: "Firms", icon: BusinessOutlinedIcon, path: "/dashboard/firm" },
  { label: "Parties", icon: PeopleOutlineIcon, path: "/dashboard/party" },
  { label: "Brokers", icon: SupportAgentOutlinedIcon, path: "/dashboard/broker" },
  { label: "Designs", icon: BrushOutlinedIcon, path: "/dashboard/design" },
  { label: "Job Cards", icon: AssignmentOutlinedIcon, path: "/dashboard/jobcard" },
  { label: "Challans", icon: DescriptionOutlinedIcon, path: "/dashboard/challans" },
  { label: "Machines", icon: PrecisionManufacturingIcon, path: "/dashboard/machine" },
  { label: "Employees", icon: BadgeOutlinedIcon, path: "/dashboard/employee" },
  { label: "Production", icon: AssignmentTurnedInOutlinedIcon, path: "/dashboard/production" },
  { label: "Reports", icon: AssessmentOutlinedIcon, path: "/dashboard/reports" },
];

function SidebarContent({ collapsed = false, onClose, theme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/$/, "");

  return (
    <List disablePadding sx={{ px: collapsed ? 0.75 : 1, pt: 1, flex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
      {navItems.map(({ label, icon: Icon, path }) => {
        const isActive = cleanPath === path || (path !== "/dashboard" && cleanPath.startsWith(path));

        const item = (
          <ListItemButton
            onClick={() => { navigate(path); onClose?.(); }}
            sx={{
              borderRadius: "6px",
              px: collapsed ? 0 : 1.25,
              py: 0.75,
              minHeight: 36,
              justifyContent: collapsed ? "center" : "flex-start",
              backgroundColor: isActive ? theme.palette.action.selected : "transparent",
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: isActive ? 600 : 400,
              "&:hover": {
                backgroundColor: isActive ? theme.palette.action.selected : theme.palette.action.hover,
                color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: collapsed ? 0 : 30,
              color: "inherit",
              justifyContent: "center",
            }}>
              <Icon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "-0.006em",
                }}
              />
            )}
          </ListItemButton>
        );

        return collapsed ? (
          <Tooltip key={label} title={label} placement="right" arrow>
            {item}
          </Tooltip>
        ) : (
          <Box key={label}>{item}</Box>
        );
      })}
    </List>
  );
}

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeFirm, setActiveFirm, firms, refreshFirms } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => { refreshFirms(); }, []);

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>

      <Navbar
        firms={firms}
        activeFirm={activeFirm}
        onFirmChange={setActiveFirm}
        onMenuClick={!isDesktop ? () => setMobileOpen(true) : undefined}
      />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Desktop Sidebar — Linear-style */}
        {isDesktop && (
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              height: `calc(100vh - ${NAV_H}px)`,
              overflowY: "auto",
              overflowX: "hidden",
              transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              "&::-webkit-scrollbar": { width: 0 },
            }}
          >
            <SidebarContent collapsed={collapsed} theme={theme} />

            {/* Collapse toggle — bottom */}
            <Box sx={{
              p: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              justifyContent: collapsed ? "center" : "flex-end",
            }}>
              <Tooltip title={collapsed ? "Expand" : "Collapse"} arrow placement="right">
                <IconButton
                  size="small"
                  onClick={() => setCollapsed((p) => !p)}
                  sx={{
                    color: "text.secondary",
                    borderRadius: "6px",
                    width: 28, height: 28,
                    "&:hover": { color: "text.primary", backgroundColor: theme.palette.action.hover },
                  }}
                >
                  {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: { width: SIDEBAR_FULL, backgroundColor: theme.palette.background.paper, borderRight: "none" },
          }}
        >
          <Box sx={{ px: 2, py: 1.75, display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "6px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography fontSize="9px" fontWeight={800} color="#fff">JW</Typography>
            </Box>
            <Typography fontSize="13px" fontWeight={700} color="text.primary">JobWork</Typography>
          </Box>
          <SidebarContent onClose={() => setMobileOpen(false)} theme={theme} />
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            backgroundColor: theme.palette.background.default,
            p: { xs: 2, sm: 2.5, md: 3 },
            minWidth: 0,
            overflowY: "auto",
            height: `calc(100vh - ${NAV_H}px)`,
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
