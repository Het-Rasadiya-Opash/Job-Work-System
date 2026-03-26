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
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import apiRequest from "../utils/ApiRequest";

const initialForm = { name: "", company_name: "", phone: "", gstin: "", address: "", city: "", state: "" };

function VepariForm({ onSuccess, onCancel, activeFirm, editData = null }) {
  const theme = useTheme();
  const [form, setForm] = useState(editData ? { name: editData.name || "", company_name: editData.company_name || "", phone: editData.phone || "", gstin: editData.gstin || "", address: editData.address || "", city: editData.city || "", state: editData.state || "", is_active: editData.is_active ?? true } : initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: name === "gstin" ? value.toUpperCase() : value })); setError(""); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const res = editData ? await apiRequest.put(`/vepari/${editData._id}`, { ...form, company_id: activeFirm?._id }) : await apiRequest.post("/vepari", { ...form, company_id: activeFirm?._id }); onSuccess(res.data.data); }
    catch (err) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px" }}>Basic Information</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} required size="small" />
        <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} required size="small" inputProps={{ maxLength: 10 }} />
        <TextField label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} size="small" />
        <TextField label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} size="small" inputProps={{ maxLength: 15, style: { textTransform: "uppercase" } }} />
      </Box>
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px", mt: 1 }}>Address</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
        <TextField label="Address" name="address" value={form.address} onChange={handleChange} size="small" />
        <TextField label="City" name="city" value={form.city} onChange={handleChange} size="small" />
        <TextField label="State" name="state" value={form.state} onChange={handleChange} size="small" />
      </Box>
      {editData && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
          <Box><Typography variant="body2" fontWeight={600}>Status</Typography><Typography variant="body2" fontSize="12px" color={form.is_active ? "success.main" : "error.main"}>{form.is_active ? "Active" : "Inactive"}</Typography></Box>
          <Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} color="success" />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>{loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editData ? "Save Changes" : "Create Party"}</Button>
      </Box>
    </Box>
  );
}

export default function ManageParty() {
  const [veparis, setVeparis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editVepari, setEditVepari] = useState(null);
  const [viewVepari, setViewVepari] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeFirm } = useAuth();
  const theme = useTheme();

  useEffect(() => { if (location.state?.openCreate) { setCreateOpen(true); navigate(location.pathname, { replace: true, state: {} }); } }, [location.state]);

  const fetchVeparis = async () => { if (!activeFirm?._id) return; setLoading(true); try { const res = await apiRequest.get("/vepari", { params: { company_id: activeFirm._id } }); setVeparis(res.data.data || []); } catch { setVeparis([]); } finally { setLoading(false); } };
  useEffect(() => { fetchVeparis(); }, [activeFirm]);

  const handleCreateSuccess = (v) => { setCreateOpen(false); setVeparis((p) => [v, ...p]); };
  const handleEditSuccess = (v) => { setEditVepari(null); setVeparis((p) => p.map((x) => x._id === v._id ? v : x)); };
  const handleDelete = async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await apiRequest.delete(`/vepari/${deleteTarget._id}`, { params: { company_id: activeFirm._id } }); setVeparis((p) => p.filter((v) => v._id !== deleteTarget._id)); setDeleteTarget(null); } catch {} finally { setDeleteLoading(false); } };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Parties</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>All your registered parties (Veparis)</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}>Add Party</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: "16px" }} />)}</Box>
      ) : veparis.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}><PeopleOutlineIcon sx={{ color: "#4F46E5", fontSize: 30 }} /></Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No parties yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Add your first party to get started</Typography>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}>Add Party</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>
          {veparis.map((v) => (
            <Paper key={v._id} elevation={0} onClick={() => setViewVepari(v)} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "16px", p: 2.5, transition: "all 0.2s ease", cursor: "pointer", "&:hover": { borderColor: theme.palette.primary.light, boxShadow: "0 12px 24px rgba(0,0,0,0.05)", transform: "translateY(-2px)" } }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PeopleOutlineIcon sx={{ color: "#4F46E5", fontSize: 20 }} /></Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.primary" noWrap>{v.name}</Typography>
                  <Chip label={v.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={v.is_active ? "success" : "error"} sx={{ mt: 0.5, height: 20, fontSize: "10px", fontWeight: 700 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditVepari(v); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main } }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: "#EF4444" } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography variant="body2" color="text.secondary"><PhoneOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{v.phone}</Typography>
                {v.company_name && <Typography variant="body2" color="text.secondary"><BusinessOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{v.company_name}</Typography>}
                {v.gstin && <Typography variant="body2" color="text.secondary"><FingerprintIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{v.gstin}</Typography>}
                {(v.city || v.state) && <Typography variant="body2" color="text.secondary"><LocationOnOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{[v.city, v.state].filter(Boolean).join(", ")}</Typography>}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Add Party</Typography><IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}><VepariForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} activeFirm={activeFirm} /></DialogContent>
      </Dialog>

      <Dialog open={Boolean(editVepari)} onClose={() => setEditVepari(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Edit Party</Typography><IconButton size="small" onClick={() => setEditVepari(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}>{editVepari && <VepariForm onSuccess={handleEditSuccess} onCancel={() => setEditVepari(null)} activeFirm={activeFirm} editData={editVepari} />}</DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: "error.light", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}><WarningAmberIcon sx={{ color: "#fff", fontSize: 28 }} /></Box>
          <Typography variant="h6">Delete Party?</Typography>
          <Typography variant="body2" color="text.secondary">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleDelete} disabled={deleteLoading} color="error">{deleteLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}</Button>
        </DialogActions>
      </Dialog>

      {/* Party Details Popup */}
      <Dialog open={Boolean(viewVepari)} onClose={() => setViewVepari(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={700}>Party Details</Typography>
          <IconButton size="small" onClick={() => setViewVepari(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          {viewVepari && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "18px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 16px rgba(79, 70, 229, 0.1)" }}><PeopleOutlineIcon sx={{ color: "#4F46E5", fontSize: 32 }} /></Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">{viewVepari.name}</Typography>
                  <Chip label={viewVepari.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={viewVepari.is_active ? "success" : "error"} sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Contact</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}><PhoneOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />{viewVepari.phone}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Registration</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}><FingerprintIcon sx={{ fontSize: 18, color: "primary.main" }} />{viewVepari.gstin || "No GSTIN"}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Company</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}><BusinessOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />{viewVepari.company_name || "Self"}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Location</Typography>
                <Box sx={{ mt: 1, p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <LocationOnOutlinedIcon sx={{ color: "primary.main", mt: 0.25 }} />
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                    {viewVepari.address || "No address provided"}<br />
                    <strong>{viewVepari.city || "N/A"}</strong>, {viewVepari.state || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button fullWidth variant="contained" onClick={() => { setEditVepari(viewVepari); setViewVepari(null); }} startIcon={<EditOutlinedIcon />}>Edit Party</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
