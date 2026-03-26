import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";

import apiRequest from "../utils/ApiRequest";
import { formatDate } from "../utils/dateUtils";

/* ─── Status Chip ────────────────────────────────────────────────── */
function StatusChip({ status }) {
  const map = {
    COMPLETED: { color: "success", label: "Completed" },
    IN_PROCESS: { color: "info", label: "In Process" },
    PENDING: { color: "warning", label: "Pending" },
    CANCELLED: { color: "error", label: "Cancelled" },
  };
  const s = map[status] || map.PENDING;
  return <Chip label={s.label} size="small" variant="tonal" color={s.color} sx={{ height: 22, fontSize: "11px", fontWeight: 700 }} />;
}

/* ─── Job Card Form ──────────────────────────────────────────────── */
function JobCardForm({ onSuccess, onCancel, activeFirm, firms, veparis, brokers }) {
  const theme = useTheme();
  const [form, setForm] = useState({ company_id: activeFirm?._id || "", vepari_id: "", design_id: "", broker_id: "", total_pieces: "", notes: "" });
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [fetchingDesigns, setFetchingDesigns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.vepari_id) {
      const fetchDesigns = async () => {
        setFetchingDesigns(true);
        try {
          const res = await apiRequest.get("/design", { params: { company_id: form.company_id, vepari_id: form.vepari_id, limit: 100 } });
          setAvailableDesigns(res.data.data || []);
          // Reset design_id if current one not in new list
          if (form.design_id && !res.data.data?.find(d => d._id === form.design_id)) {
            setForm(prev => ({ ...prev, design_id: "" }));
          }
        } catch (err) {
          console.error("Failed to fetch designs", err);
        } finally {
          setFetchingDesigns(false);
        }
      };
      fetchDesigns();
    } else {
      setAvailableDesigns([]);
      setForm(prev => ({ ...prev, design_id: "" }));
    }
  }, [form.vepari_id, form.company_id]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { ...form, total_pieces: Number(form.total_pieces) };
      if (!payload.broker_id) delete payload.broker_id;
      const res = await apiRequest.post("/jobcard", payload);
      onSuccess(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}

      <TextField select label="Generating Firm" name="company_id" value={form.company_id} onChange={handleChange} required fullWidth size="small">
        {firms.map((f) => <MenuItem key={f._id} value={f._id}>{f.firm_name}</MenuItem>)}
      </TextField>

      <TextField select label="Party (Vepari)" name="vepari_id" value={form.vepari_id} onChange={handleChange} required fullWidth size="small">
        {veparis.map((v) => <MenuItem key={v._id} value={v._id}>{v.name} {v.company_name ? `(${v.company_name})` : ""}</MenuItem>)}
      </TextField>

      <TextField select label="Design" name="design_id" value={form.design_id} onChange={handleChange} required fullWidth size="small"
        disabled={!form.vepari_id || fetchingDesigns}
        helperText={!form.vepari_id ? "Select a party first" : fetchingDesigns ? "Loading designs..." : ""}
      >
        {availableDesigns.map((d) => <MenuItem key={d._id} value={d._id}>{d.design_number} — {d.stitch_count} stitches</MenuItem>)}
      </TextField>

      <TextField select label="Broker (Optional)" name="broker_id" value={form.broker_id} onChange={handleChange} fullWidth size="small">
        <MenuItem value="">No Broker</MenuItem>
        {brokers.map((b) => <MenuItem key={b._id} value={b._id}>{b.name} ({b.commission_rate}%)</MenuItem>)}
      </TextField>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Total Pieces" name="total_pieces" value={form.total_pieces} onChange={handleChange} required type="number" inputProps={{ min: 1 }} size="small" />
        <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" size="small" />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>
          {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Generate Job Card"}
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Log Challan Form ───────────────────────────────────────────── */
function LogChallanForm({ type, jobCard, onSuccess, onCancel, activeFirm, firms }) {
  const theme = useTheme();
  const [form, setForm] = useState({ company_id: activeFirm?._id || "", pieces: "", vehicle_number: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxAllowed = type === "INWARD"
    ? jobCard.total_pieces - (jobCard.inward_pieces || 0)
    : (jobCard.inward_pieces || 0) - (jobCard.outward_pieces || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await apiRequest.post(`/jobcard/${jobCard._id}/${type.toLowerCase()}`, { ...form, pieces: Number(form.pieces) });
      onSuccess(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const isInward = type === "INWARD";

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}

      <Alert severity="info" sx={{ borderRadius: "10px" }}>
        Logging <strong>{type}</strong> for <strong>{jobCard.job_card_number}</strong>. Max: <strong>{maxAllowed}</strong> pieces.
      </Alert>

      <TextField select label="Issuing Firm" name="company_id" value={form.company_id} onChange={handleChange} required fullWidth size="small">
        {firms.map((f) => <MenuItem key={f._id} value={f._id}>{f.firm_name}</MenuItem>)}
      </TextField>

      <TextField label="Pieces" name="pieces" value={form.pieces} onChange={handleChange} required type="number" inputProps={{ min: 1, max: maxAllowed }} size="small" fullWidth />
      <TextField label="Vehicle / Transport No." name="vehicle_number" value={form.vehicle_number} onChange={handleChange} placeholder="e.g. GJ05 XX 1234" size="small" fullWidth inputProps={{ style: { textTransform: "uppercase" } }} />
      <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" size="small" fullWidth />

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading || maxAllowed <= 0}
          color={isInward ? "success" : "warning"}
        >
          {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : `Log ${type}`}
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Edit Job Card Form ─────────────────────────────────────────── */
function EditJobCardForm({ jobCard, onSuccess, onCancel, activeFirm, firms, veparis, brokers }) {
  const theme = useTheme();
  const [form, setForm] = useState({
    company_id: jobCard.company_id?._id || activeFirm?._id || "",
    vepari_id: jobCard.vepari_id?._id || "",
    design_id: jobCard.design_id?._id || "",
    broker_id: jobCard.broker_id?._id || "",
    total_pieces: jobCard.total_pieces || "",
    notes: jobCard.notes || "",
  });
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [fetchingDesigns, setFetchingDesigns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.vepari_id) {
      const fetchDesigns = async () => {
        setFetchingDesigns(true);
        try {
          const res = await apiRequest.get("/design", { params: { company_id: form.company_id, vepari_id: form.vepari_id, limit: 100 } });
          setAvailableDesigns(res.data.data || []);
          // Reset design_id if current one not in new list
          if (form.design_id && !res.data.data?.find(d => d._id === form.design_id)) {
            setForm(prev => ({ ...prev, design_id: "" }));
          }
        } catch (err) {
          console.error("Failed to fetch designs", err);
        } finally {
          setFetchingDesigns(false);
        }
      };
      fetchDesigns();
    } else {
      setAvailableDesigns([]);
      setForm(prev => ({ ...prev, design_id: "" }));
    }
  }, [form.vepari_id, form.company_id]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { ...form, total_pieces: Number(form.total_pieces) };
      if (!payload.broker_id) payload.broker_id = null;
      const res = await apiRequest.put(`/jobcard/${jobCard._id}`, payload);
      onSuccess(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}

      <Alert severity="info" sx={{ borderRadius: "10px" }}>
        Editing <strong>{jobCard.job_card_number}</strong>. Min total pieces: <strong>{jobCard.inward_pieces}</strong>.
      </Alert>

      <TextField select label="Party (Vepari)" name="vepari_id" value={form.vepari_id} onChange={handleChange} required fullWidth size="small">
        {veparis.map((v) => <MenuItem key={v._id} value={v._id}>{v.name} {v.company_name ? `(${v.company_name})` : ""}</MenuItem>)}
      </TextField>

      <TextField select label="Design" name="design_id" value={form.design_id} onChange={handleChange} required fullWidth size="small"
        disabled={!form.vepari_id || fetchingDesigns}
        helperText={!form.vepari_id ? "Select a party first" : fetchingDesigns ? "Loading designs..." : ""}
      >
        {availableDesigns.map((d) => <MenuItem key={d._id} value={d._id}>{d.design_number} — {d.stitch_count} stitches</MenuItem>)}
      </TextField>

      <TextField select label="Broker (Optional)" name="broker_id" value={form.broker_id} onChange={handleChange} fullWidth size="small">
        <MenuItem value="">No Broker</MenuItem>
        {brokers.map((b) => <MenuItem key={b._id} value={b._id}>{b.name} ({b.commission_rate}%)</MenuItem>)}
      </TextField>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Total Pieces" name="total_pieces" value={form.total_pieces} onChange={handleChange} required type="number" inputProps={{ min: jobCard.inward_pieces || 1 }} size="small" />
        <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" size="small" />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>
          {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Edit Challan Form (for Job Card page) ──────────────────────── */
function EditChallanForm({ challan, firms, onSuccess, onCancel }) {
  const theme = useTheme();
  const [form, setForm] = useState({
    company_id: challan.company_id?._id || "",
    pieces: challan.pieces || "",
    vehicle_number: challan.vehicle_number || "",
    notes: challan.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await apiRequest.put(`/challan/${challan._id}`, { ...form, pieces: Number(form.pieces) });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
      <Alert severity="info" sx={{ borderRadius: "10px" }}>
        Editing <strong>{challan.challan_number}</strong> ({challan.challan_type})
      </Alert>
      <TextField select label="Firm" name="company_id" value={form.company_id} onChange={handleChange} required fullWidth size="small">
        {firms.map((f) => <MenuItem key={f._id} value={f._id}>{f.firm_name}</MenuItem>)}
      </TextField>
      <TextField label="Pieces" name="pieces" value={form.pieces} onChange={handleChange} required type="number" inputProps={{ min: 1 }} size="small" fullWidth />
      <TextField label="Vehicle / Transport No." name="vehicle_number" value={form.vehicle_number} onChange={handleChange} placeholder="e.g. GJ05 XX 1234" size="small" fullWidth inputProps={{ style: { textTransform: "uppercase" } }} />
      <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" size="small" fullWidth />
      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>
          {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ManageJobCard() {
  const [jobCards, setJobCards] = useState([]);
  const [veparis, setVeparis] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewJobCard, setViewJobCard] = useState(null);
  const [logModal, setLogModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editChallanModal, setEditChallanModal] = useState(null);
  const [successData, setSuccessData] = useState(null); // { challan, type }


  const location = useLocation();
  const navigate = useNavigate();
  const { activeFirm, firms } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (location.state?.openCreate) { setCreateOpen(true); navigate(location.pathname, { replace: true, state: {} }); }
  }, [location.state]);

  const fetchData = async () => {
    if (!activeFirm?._id) return;
    setLoading(true);
    const p = { params: { company_id: activeFirm._id } };
    const fetchSafe = async (url, customParams) => {
      try { const res = await apiRequest.get(url, customParams || p); return res.data?.data || null; }
      catch { return null; }
    };
    const [jc, v, b] = await Promise.all([fetchSafe("/jobcard", p), fetchSafe("/vepari"), fetchSafe("/broker")]);
    setJobCards(jc?.data || []);
    setVeparis(v || []);
    setBrokers(b || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeFirm]);

  const handleCreateSuccess = () => { setCreateOpen(false); fetchData(); };
  const handleLogSuccess = (challan) => {
    const type = logModal?.type;
    setLogModal(null);
    setSuccessData({ challan, type });
    fetchData();
  };
  const handleEditSuccess = () => { setEditModal(null); setViewJobCard(null); fetchData(); };
  const handleEditChallanSuccess = () => { setEditChallanModal(null); fetchData(); };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Job Cards</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Track embroidery job progress and challans</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Generate Job Card
        </Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: "16px" }} />)}
        </Box>
      ) : jobCards.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: "16px",
            background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
            display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5,
          }}>
            <AssignmentOutlinedIcon sx={{ color: "#4F46E5", fontSize: 30 }} />
          </Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No Job Cards yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Generate your first job card to begin tracking flow</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Generate Job Card</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
          {jobCards.map((jc) => (
            <Paper key={jc._id} elevation={0} onClick={() => setViewJobCard(jc)} sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "16px", p: 3,
              transition: "all 0.2s ease", cursor: "pointer",
              "&:hover": { borderColor: theme.palette.primary.light, boxShadow: "0 12px 24px rgba(0,0,0,0.05)", transform: "translateY(-2px)" },
            }}>
              {/* Top Row */}
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
                <Box>
                  <Typography variant="subtitle1" color="text.primary">
                    {jc.job_card_number}
                    {jc.company_id?.firm_name && <Chip label={jc.company_id.firm_name} size="small" sx={{ ml: 1, fontSize: "10px", height: 20 }} />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.25}>{formatDate(jc.created_at)}</Typography>
                </Box>
                <StatusChip status={jc.status} />
              </Box>

              {/* Info Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2.5 }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <PersonOutlineIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>Party</Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>{jc.vepari_id?.name || "—"}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <BrushOutlinedIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>Design</Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>{jc.design_id?.design_number || "—"}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 2.5, p: 2, backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: "12px", border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" fontSize="12px">Inventory Progress</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary" fontSize="12px">Total: {jc.total_pieces}</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 4, backgroundColor: theme.palette.divider, overflow: "hidden", display: "flex" }}>
                  <Tooltip title={`Inward: ${jc.inward_pieces}`}>
                    <Box sx={{ width: `${(jc.inward_pieces / jc.total_pieces) * 100}%`, height: "100%", backgroundColor: "#16A34A", transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
                  </Tooltip>
                  <Tooltip title={`Outward: ${jc.outward_pieces}`}>
                    <Box sx={{ width: `${(jc.outward_pieces / jc.total_pieces) * 100}%`, height: "100%", backgroundColor: "#CA8A04", transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
                  </Tooltip>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Typography fontSize="11px" color="#16A34A" fontWeight={600}>Inward: {jc.inward_pieces}</Typography>
                  <Typography fontSize="11px" color="#CA8A04" fontWeight={600}>Outward: {jc.outward_pieces}</Typography>
                </Box>
              </Box>

              {/* Firm-wise Breakdown */}
              {jc.challans && jc.challans.length > 0 && (
                <Box sx={{ mb: 2.5, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 30px", backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#F1F5F9", px: 1.5, py: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Firm</Typography>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">Type</Typography>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">Pcs</Typography>
                    <Box />
                  </Box>
                  {jc.challans.map((c, idx) => (
                    <Box key={c._id || idx} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 30px", px: 1.5, py: 0.6, borderTop: `1px solid ${theme.palette.divider}`, alignItems: "center" }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: "12px" }}>{c.company_id?.firm_name || "—"}</Typography>
                      <Typography variant="body2" fontWeight={600} textAlign="center" fontSize="11px" color={c.challan_type === "INWARD" ? "success.main" : "warning.main"}>{c.challan_type === "INWARD" ? "IN" : "OUT"}</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="center" fontSize="12px" color={c.challan_type === "INWARD" ? "success.main" : "warning.main"}>{c.pieces}</Typography>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditChallanModal(c); }} sx={{ p: 0.3 }}>
                        <EditIcon sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button variant="contained" size="small" fullWidth onClick={(e) => { e.stopPropagation(); setLogModal({ type: "INWARD", jobCard: jc }); }}
                  disabled={jc.inward_pieces >= jc.total_pieces || jc.status === "CANCELLED"}
                  startIcon={<CallReceivedIcon />}
                  color="success"
                  sx={{ fontSize: "12px" }}
                >Log Inward</Button>
                <Button variant="contained" size="small" fullWidth onClick={(e) => { e.stopPropagation(); setLogModal({ type: "OUTWARD", jobCard: jc }); }}
                  disabled={jc.outward_pieces >= jc.inward_pieces || jc.inward_pieces === 0 || jc.status === "CANCELLED"}
                  startIcon={<CallMadeIcon />}
                  color="warning"
                  sx={{ fontSize: "12px" }}
                >Log Outward</Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" color="text.primary">Generate Job Card</Typography>
          <IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <JobCardForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} activeFirm={activeFirm} firms={firms} veparis={veparis} brokers={brokers} />
        </DialogContent>
      </Dialog>

      {/* Log Challan Dialog */}
      <Dialog open={Boolean(logModal)} onClose={() => setLogModal(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" color="text.primary">Log {logModal?.type === "INWARD" ? "Inward" : "Outward"}</Typography>
          <IconButton size="small" onClick={() => setLogModal(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {logModal && <LogChallanForm type={logModal.type} jobCard={logModal.jobCard} activeFirm={activeFirm} firms={firms} onSuccess={handleLogSuccess} onCancel={() => setLogModal(null)} />}
        </DialogContent>
      </Dialog>

      {/* Job Card Details Popup */}
      <Dialog open={Boolean(viewJobCard)} onClose={() => setViewJobCard(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={700}>Job Card Details</Typography>
          <IconButton size="small" onClick={() => setViewJobCard(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          {viewJobCard && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              {/* Header Info */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">{viewJobCard.job_card_number}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>{formatDate(viewJobCard.created_at)}</Typography>
                </Box>
                <StatusChip status={viewJobCard.status} />
              </Box>

              {/* Design & Party */}
              <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "10px", background: viewJobCard.design_id?.image_url ? "none" : "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: viewJobCard.design_id?.image_url ? `1px solid ${theme.palette.divider}` : "none" }}>
                  {viewJobCard.design_id?.image_url ? <img src={viewJobCard.design_id.image_url} alt="Design" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <BrushOutlinedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Party / Design</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">{viewJobCard.vepari_id?.name || "—"}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewJobCard.design_id?.design_number || "—"} ({viewJobCard.design_id?.stitch_count?.toLocaleString()} st.)</Typography>
                </Box>
              </Box>

              {/* Inventory Stats */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", textAlign: "center", backgroundColor: "rgba(79, 70, 229, 0.02)" }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase" }}>Total Order</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">{viewJobCard.total_pieces}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", textAlign: "center", backgroundColor: "rgba(22, 163, 74, 0.02)" }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase" }}>Inward Rec.</Typography>
                  <Typography variant="h6" fontWeight={800} color="success.main">{viewJobCard.inward_pieces}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", textAlign: "center", backgroundColor: "rgba(202, 138, 4, 0.02)" }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase" }}>Outward Sent</Typography>
                  <Typography variant="h6" fontWeight={800} color="warning.main">{viewJobCard.outward_pieces}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", textAlign: "center", backgroundColor: theme.palette.background.paper }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase" }}>Balance</Typography>
                  <Typography variant="h6" fontWeight={800} color="text.primary">{viewJobCard.inward_pieces - viewJobCard.outward_pieces}</Typography>
                </Paper>
              </Box>

              {/* Broker */}
              {viewJobCard.broker_id && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Broker Details</Typography>
                  <Box sx={{ mt: 1, p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={600}>{viewJobCard.broker_id.name}</Typography>
                    <Chip label={`${viewJobCard.broker_id.commission_rate}% Comm.`} size="small" variant="tonal" color="primary" />
                  </Box>
                </Box>
              )}

              {/* Notes */}
              {viewJobCard.notes && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Notes</Typography>
                  <Typography variant="body2" sx={{ mt: 1, p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, fontStyle: "italic" }}>
                    "{viewJobCard.notes}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, gap: 1.5 }}>
          <Button fullWidth variant="outlined" onClick={() => setViewJobCard(null)}>Close</Button>
          <Button fullWidth variant="contained" startIcon={<EditIcon />} onClick={() => { setEditModal(viewJobCard); setViewJobCard(null); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Card Dialog */}
      <Dialog open={Boolean(editModal)} onClose={() => setEditModal(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" color="text.primary">Edit Job Card</Typography>
          <IconButton size="small" onClick={() => setEditModal(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {editModal && <EditJobCardForm jobCard={editModal} onSuccess={handleEditSuccess} onCancel={() => setEditModal(null)} activeFirm={activeFirm} firms={firms} veparis={veparis} brokers={brokers} />}
        </DialogContent>
      </Dialog>

      {/* Edit Challan Dialog */}
      <Dialog open={Boolean(editChallanModal)} onClose={() => setEditChallanModal(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={700}>Edit Challan</Typography>
          <IconButton size="small" onClick={() => setEditChallanModal(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {editChallanModal && <EditChallanForm challan={editChallanModal} firms={firms} onSuccess={handleEditChallanSuccess} onCancel={() => setEditChallanModal(null)} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
