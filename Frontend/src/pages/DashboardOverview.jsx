import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

import { useAuth } from "../context/AuthContext";
import apiRequest from "../utils/ApiRequest";

/* ─── Metric Card (Stripe-inspired) ─────────────────────────────── */
function MetricCard({ title, value, subtitle, icon, color, theme }) {
  return (
    <Paper
      sx={{
        p: 2.5, borderRadius: "10px",
        display: "flex", flexDirection: "column", gap: 1.5,
        "&:hover": { borderColor: alpha(color, 0.3) },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Box sx={{
          width: 32, height: 32, borderRadius: "8px",
          backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.15 : 0.08),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: color,
        }}>
          {icon}
        </Box>
      </Box>
      <Typography fontSize="28px" fontWeight={700} color="text.primary" lineHeight={1} letterSpacing="-0.02em">
        {value}
      </Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function OverviewSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={180} height={32} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={280} height={18} sx={{ mb: 3 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: "10px" }} />)}
      </Box>
    </Box>
  );
}

/* ─── Empty State ────────────────────────────────────────────────── */
function EmptyState({ firms, navigate, theme }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center" }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: "12px",
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5,
      }}>
        <BusinessOutlinedIcon sx={{ fontSize: 28, color: "primary.main" }} />
      </Box>
      <Typography variant="h3" color="text.primary" mb={0.75}>
        {firms?.length === 0 ? "Get started" : "Select a firm"}
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={400} mb={3} lineHeight={1.6}>
        {firms?.length === 0
          ? "Create your first firm to start managing job cards and tracking your embroidery business."
          : "Select a firm from the dropdown above to view your dashboard."}
      </Typography>
      {firms?.length === 0 && (
        <Button variant="contained" onClick={() => navigate("/dashboard/firm")} endIcon={<ArrowForwardIcon />}>
          Create Your First Firm
        </Button>
      )}
    </Box>
  );
}

/* ─── Status Chip ────────────────────────────────────────────────── */
function StatusChip({ status }) {
  const map = {
    COMPLETED: { color: "#059669", bg: "#D1FAE5", label: "Completed" },
    IN_PROCESS: { color: "#2563EB", bg: "#DBEAFE", label: "In Process" },
    PENDING: { color: "#D97706", bg: "#FEF3C7", label: "Pending" },
    CANCELLED: { color: "#DC2626", bg: "#FEE2E2", label: "Cancelled" },
  };
  const s = map[status] || map.PENDING;
  return <Chip label={s.label} size="small" sx={{ backgroundColor: s.bg, color: s.color, border: "none" }} />;
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function DashboardOverview() {
  const { activeFirm, firms } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!activeFirm?._id) { setLoading(false); return; }
      setLoading(true);
      try {
        const res = await apiRequest.get("/dashboard/stats", { params: { company_id: activeFirm._id } });
        setStats(res.data.data);
      } catch (err) { console.error("Failed to fetch dashboard stats", err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [activeFirm]);

  if (loading) return <OverviewSkeleton />;
  if (!activeFirm?._id) return <EmptyState firms={firms} navigate={navigate} theme={theme} />;
  if (!stats) return (
    <Box sx={{ textAlign: "center", mt: 12 }}>
      <Typography color="text.secondary">Unable to load statistics.</Typography>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" color="text.primary">Overview</Typography>
        <Typography variant="body1" color="text.secondary" mt={0.25}>
          Welcome back — here's what's happening at <strong>{activeFirm?.firm_name}</strong>
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard
          title="Revenue" value={`₹${stats.financial.totalRevenue.toLocaleString()}`}
          color="#4F46E5" icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />}
          subtitle="Lifetime" theme={theme}
        />
        <MetricCard
          title="Job Cards" value={stats.summary.jobCards}
          color="#059669" icon={<AssignmentOutlinedIcon sx={{ fontSize: 18 }} />}
          subtitle={`${stats.cards.inProcess} in process`} theme={theme}
        />
        <MetricCard
          title="Outward" value={stats.inventory.outward.toLocaleString()}
          color="#EA580C" icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />}
          subtitle={`of ${stats.inventory.total.toLocaleString()} total`} theme={theme}
        />
        <MetricCard
          title="People" value={stats.summary.veparis + stats.summary.brokers}
          color="#7C3AED" icon={<PeopleOutlineIcon sx={{ fontSize: 18 }} />}
          subtitle={`${stats.summary.veparis} parties · ${stats.summary.brokers} brokers`} theme={theme}
        />
      </Box>

      {/* Lower Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2 }}>

        {/* Recent Job Cards */}
        <Paper sx={{ borderRadius: "10px", overflow: "hidden" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 2 }}>
            <Typography variant="subtitle1" color="text.primary">Recent job cards</Typography>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: "14px!important" }} />}
              onClick={() => navigate("/dashboard/jobcard")}
              sx={{ fontSize: "12px" }}
            >
              View all
            </Button>
          </Box>
          <Divider />

          {stats.recentJobCards.length === 0 ? (
            <Box sx={{ px: 2.5, py: 5, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No job cards yet</Typography>
            </Box>
          ) : (
            <Box>
              {stats.recentJobCards.map((jc, i) => (
                <Box key={jc._id}>
                  <Box
                    onClick={() => navigate("/dashboard/jobcard")}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      px: 2.5, py: 1.75,
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                      "&:hover": { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: "8px",
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <AssignmentOutlinedIcon sx={{ color: "primary.main", fontSize: 16 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" color="text.primary" noWrap>{jc.job_card_number}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {jc.vepari_id?.name} · {jc.design_id?.design_number}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>In: {jc.inward_pieces}</Typography>
                          <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 600 }}>Out: {jc.outward_pieces}</Typography>
                          <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600 }}>Pen: {jc.inward_pieces - jc.outward_pieces}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0, ml: 2, display: { xs: "none", sm: "block" } }}>
                      <Typography variant="subtitle2" color="text.primary">₹{jc.total_amount?.toLocaleString()}</Typography>
                      <Box sx={{ mt: 0.25 }}><StatusChip status={jc.status} /></Box>
                    </Box>
                  </Box>
                  {i < stats.recentJobCards.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Quick Stats */}
        <Paper sx={{ borderRadius: "10px", overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="subtitle1" color="text.primary">Breakdown</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            {[
              { icon: <BrushOutlinedIcon />, label: "Designs", value: stats.summary.designs, color: "#EF4444" },
              { icon: <Inventory2OutlinedIcon />, label: "Pending dispatch", value: stats.inventory.pending_outward, color: "#0D9488" },
              { icon: <TrendingUpOutlinedIcon />, label: "Pending cards", value: stats.cards.pending, color: "#D97706" },
            ].map((item, i) => (
              <Box key={i}>
                <Box sx={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  py: 1.5, px: 1,
                  borderRadius: "6px",
                  transition: "background-color 0.1s ease",
                  "&:hover": { backgroundColor: theme.palette.action.hover },
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: "8px",
                      backgroundColor: alpha(item.color, theme.palette.mode === "dark" ? 0.15 : 0.08),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.color, "& svg": { fontSize: 16 },
                    }}>
                      {item.icon}
                    </Box>
                    <Typography variant="body2" fontWeight={500} color="text.primary">{item.label}</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">{item.value}</Typography>
                </Box>
                {i < 2 && <Divider sx={{ mx: 1 }} />}
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
