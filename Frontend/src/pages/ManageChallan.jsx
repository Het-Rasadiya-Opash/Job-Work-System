import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import PrintIcon from "@mui/icons-material/Print";
import FilterListIcon from "@mui/icons-material/FilterList";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";

import { useAuth } from "../context/AuthContext";
import apiRequest from "../utils/ApiRequest";
import { formatDate } from "../utils/dateUtils";

export default function ManageChallan() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { activeFirm, firms } = useAuth();
  
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editModal, setEditModal] = useState(null);

  const fetchChallans = async () => {
    if (!activeFirm?._id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page,
        limit: 20
      });
      if (type) params.append("type", type);

      const res = await apiRequest.get(`/challan?${params.toString()}`);
      setChallans(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (error) {
      console.error("Failed to fetch challans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [activeFirm, type, page]);

  const handleEditSuccess = () => { setEditModal(null); fetchChallans(); };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h2" color="text.primary">Challans</Typography>
          <Typography variant="body1" color="text.secondary">History of all inward and outward movements</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", border: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterListIcon sx={{ color: "text.disabled", mr: 1 }} />
          <TextField
            select
            label="Challan Type"
            size="small"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="INWARD">Inward</MenuItem>
            <MenuItem value="OUTWARD">Outward</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Showing {challans.length} of {total} records
          </Typography>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableCell sx={{ fontWeight: 700 }}>Challan No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Firm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Job Card</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vepari</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Design</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Pieces</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : challans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.1 }} />
                    <Typography color="text.disabled">No challans found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                challans.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.challan_number}</TableCell>
                    <TableCell>{row.company_id?.firm_name}</TableCell>
                    <TableCell>
                      <Chip
                        icon={row.challan_type === "INWARD" ? <CallReceivedIcon sx={{ fontSize: "14px !important" }} /> : <CallMadeIcon sx={{ fontSize: "14px !important" }} />}
                        label={row.challan_type}
                        size="small"
                        color={row.challan_type === "INWARD" ? "success" : "warning"}
                        variant="tonal"
                      />
                    </TableCell>
                    <TableCell>{row.job_card_id?.job_card_number}</TableCell>
                    <TableCell>{row.job_card_id?.vepari_id?.name}</TableCell>
                    <TableCell>{row.job_card_id?.design_id?.design_number}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{row.pieces}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "13px" }}>
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit Challan">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => setEditModal(row)}
                            sx={{ backgroundColor: alpha(theme.palette.text.primary, 0.04) }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Challan">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/print-challan/${row._id}?company_id=${row.company_id?._id || activeFirm._id}`)}
                            sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Challan Dialog */}
      <Dialog open={Boolean(editModal)} onClose={() => setEditModal(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={700}>Edit Challan</Typography>
          <IconButton size="small" onClick={() => setEditModal(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {editModal && <EditChallanForm challan={editModal} firms={firms} onSuccess={handleEditSuccess} onCancel={() => setEditModal(null)} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ─── Edit Challan Form ──────────────────────────────────────────── */
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
      const payload = { ...form, pieces: Number(form.pieces) };
      await apiRequest.put(`/challan/${challan._id}`, payload);
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
