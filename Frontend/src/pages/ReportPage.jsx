import { useState, useEffect } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import FilterListIcon from "@mui/icons-material/FilterList";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";

import { useAuth } from "../context/AuthContext";
import apiRequest from "../utils/ApiRequest";
import { formatDate } from "../utils/dateUtils";

const TABS = [
  { label: "Pending Stock", icon: Inventory2OutlinedIcon, id: 0 },
  { label: "Broker Commission", icon: MonetizationOnOutlinedIcon, id: 1 },
  { label: "Vepari Ledger", icon: HistoryEduOutlinedIcon, id: 2 },
  { label: "Production Summary", icon: SummarizeOutlinedIcon, id: 3 },
];

export default function ReportPage() {
  const theme = useTheme();
  const { activeFirm } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vepariId, setVepariId] = useState("");
  const [veparis, setVeparis] = useState([]);

  // Fetch veparis for ledger filter
  useEffect(() => {
    if (activeFirm?._id) {
      apiRequest.get(`/vepari?company_id=${activeFirm._id}`)
        .then(res => setVeparis(res.data.data))
        .catch(err => console.error("Failed to fetch veparis:", err));
    }
  }, [activeFirm]);

  // Fetch report data
  const fetchReport = async () => {
    if (!activeFirm?._id) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      let endpoint = "";
      const params = new URLSearchParams({ company_id: activeFirm._id });

      if (tab === 0) endpoint = "/report/pending-stock";
      if (tab === 1) {
        endpoint = "/report/broker-commission";
        if (fromDate) params.append("from", fromDate);
        if (toDate) params.append("to", toDate);
      }
      if (tab === 2) {
        endpoint = "/report/vepari-ledger";
        if (vepariId) params.append("vepari_id", vepariId);
        else { setLoading(false); return; } // Need vepari for ledger
      }
      if (tab === 3) {
        endpoint = "/report/production-summary";
        if (fromDate) params.append("from", fromDate);
        if (toDate) params.append("to", toDate);
      }

      const res = await apiRequest.get(`${endpoint}?${params.toString()}`);
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data || (Array.isArray(data) && data.length === 0)) return;

    let headers = [];
    let rows = [];
    let filename = "";

    if (tab === 0) {
      filename = "Pending_Stock_Report.csv";
      headers = ["JC Number", "Vepari", "Design", "Inward", "Outward", "Pending", "Status"];
      rows = data.map(r => [
        `"${r.job_card_number || ''}"`,
        `"${r.vepari?.name || ''}"`,
        `"${r.design?.design_number || ''}"`,
        r.inward_pieces || 0,
        r.outward_pieces || 0,
        r.pending_pieces || 0,
        `"${r.status || ''}"`
      ]);
    } else if (tab === 1) {
      filename = "Broker_Commission_Report.csv";
      headers = ["Broker Name", "Jobs", "Total Amount", "Comm. Rate (%)", "Total Commission"];
      rows = data.map(r => [
        `"${r.broker?.name || ''}"`,
        r.total_jobs || 0,
        r.total_amount || 0,
        r.broker?.commission_rate || 0,
        r.total_commission || 0
      ]);
    } else if (tab === 2) {
      const vName = veparis.find(v => v._id === vepariId)?.name || "Report";
      filename = `Vepari_Ledger_${vName.replace(/\s+/g, "_")}.csv`;
      headers = ["Date", "JC Number", "Design", "Rate", "Pieces", "Total Amount", "Status"];
      rows = data.map(r => [
        `"${new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}"`,
        `"${r.job_card_number || ''}"`,
        `"${r.design_id?.design_number || ''}"`,
        r.rate_per_piece || 0,
        r.total_pieces || 0,
        r.total_amount || 0,
        `"${r.status || ''}"`
      ]);
    } else if (tab === 3) {
      filename = "Production_Summary_Report.csv";
      const s = data[0] || {};
      headers = ["Total Jobs", "Total Pieces", "Total Inward", "Total Pending", "Total Revenue"];
      rows = [[
        s.total_jobs || 0,
        s.total_pieces || 0,
        s.total_inward || 0,
        s.total_pending || 0,
        s.total_revenue || 0
      ]];
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (tab !== 2) fetchReport();
    else if (vepariId) fetchReport();
  }, [tab, activeFirm, vepariId]); // Auto fetch when tab or firm or vepari changes

  const renderTable = () => {
    if (loading) return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} thickness={5} sx={{ color: "primary.main" }} />
      </Box>
    );

    if (error) return (
      <Alert severity="error" sx={{ my: 2, borderRadius: "8px" }}>{error}</Alert>
    );

    if (!data || (Array.isArray(data) && data.length === 0)) return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
        <AssessmentOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
        <Typography variant="body1">No data found for this period</Typography>
      </Box>
    );

    if (tab === 0) return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>JC Number</TableCell>
              <TableCell>Vepari</TableCell>
              <TableCell>Design</TableCell>
              <TableCell align="right">Inward</TableCell>
              <TableCell align="right">Outward</TableCell>
              <TableCell align="right">Pending</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.job_card_number}</TableCell>
                <TableCell>{row.vepari?.name}</TableCell>
                <TableCell>{row.design?.design_number}</TableCell>
                <TableCell align="right">{row.inward_pieces}</TableCell>
                <TableCell align="right">{row.outward_pieces}</TableCell>
                <TableCell align="right" sx={{ color: "primary.main", fontWeight: 700 }}>{row.pending_pieces}</TableCell>
                <TableCell align="right">
                  <Chip label={row.status} size="small" variant="tonal" color={row.status === "IN_PROCESS" ? "info" : "warning"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    if (tab === 1) return (
      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Broker Name</TableCell>
              <TableCell align="right">Jobs</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="right">Comm. Rate</TableCell>
              <TableCell align="right">Total Commission</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.broker?.name}</TableCell>
                <TableCell align="right">{row.total_jobs}</TableCell>
                <TableCell align="right">₹{row.total_amount?.toLocaleString()}</TableCell>
                <TableCell align="right">{row.broker?.commission_rate}%</TableCell>
                <TableCell align="right" sx={{ color: "success.main", fontWeight: 700 }}>₹{row.total_commission?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    if (tab === 2) return (
      <TableContainer>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>JC Number</TableCell>
              <TableCell>Design</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Pieces</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{formatDate(row.created_at)}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.job_card_number}</TableCell>
                <TableCell>{row.design_id?.design_number}</TableCell>
                <TableCell align="right">₹{row.rate_per_piece}</TableCell>
                <TableCell align="right">{row.total_pieces}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.total_amount?.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Chip label={row.status} size="small" variant="tonal" color={row.status === "COMPLETED" ? "success" : "warning"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    if (tab === 3) {
      const stats = data[0] || {};
      return (
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={3} sx={{ mb: 4 }} flexWrap="wrap">
            {[
              { label: "Total Jobs", val: stats.total_jobs, color: "primary" },
              { label: "Total Pieces", val: stats.total_pieces, color: "info" },
              { label: "Total Inward", val: stats.total_inward, color: "success" },
              { label: "Total Pending", val: stats.total_pending, color: "warning" },
              { label: "Total Revenue", val: `₹${stats.total_revenue?.toLocaleString()}`, color: "secondary" },
            ].map(s => (
              <Paper key={s.label} variant="outlined" sx={{ p: 2, flex: 1, minWidth: 160, backgroundColor: alpha(theme.palette[s.color].main, 0.03), borderColor: alpha(theme.palette[s.color].main, 0.1) }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{s.label}</Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{s.val || 0}</Typography>
              </Paper>
            ))}
          </Stack>
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
            Production summary calculated from all job cards in selected date range.
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h2" color="text.primary">Reports</Typography>
          <Typography variant="body1" color="text.secondary">Analyze your business performance and inventory</Typography>
        </Box>
        <Tooltip title="Export to CSV">
          <span>
            <IconButton
              onClick={handleExport}
              disabled={!data || (Array.isArray(data) && data.length === 0)}
              sx={{
                backgroundColor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
              }}
            >
              <DownloadOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setData(null); setError(""); }}
          sx={{
            px: 2,
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": { minHeight: 48, fontSize: "14px", textTransform: "none", fontWeight: 500 },
          }}
        >
          {TABS.map(t => (
            <Tab key={t.id} icon={<t.icon sx={{ fontSize: 18 }} />} iconPosition="start" label={t.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", border: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 2 }}>
          <FilterListIcon sx={{ color: "text.disabled", mr: 1 }} />

          {(tab === 1 || tab === 3) && (
            <>
              <TextField
                label="From Date" type="date" size="small" value={fromDate} onChange={e => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ width: 160 }}
              />
              <TextField
                label="To Date" type="date" size="small" value={toDate} onChange={e => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ width: 160 }}
              />
            </>
          )}

          {tab === 2 && (
            <TextField
              select label="Select Vepari" size="small" value={vepariId} onChange={e => setVepariId(e.target.value)}
              sx={{ width: 220 }}
            >
              {veparis.map(v => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
            </TextField>
          )}

          <IconButton color="primary" onClick={fetchReport} sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
            <FilterListIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Paper>

      {/* Report Content */}
      <Paper sx={{ borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
        {renderTable()}
      </Paper>
    </Box>
  );
}
