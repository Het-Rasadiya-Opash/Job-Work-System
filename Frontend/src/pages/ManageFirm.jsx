import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
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

import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import apiRequest from "../utils/ApiRequest";
import { useAuth } from "../context/AuthContext";

const initialForm = { firm_name: "", gstin: "", address: "", city: "", state: "", pincode: "", phone: "", logo_url: "", isDefault: false };

function FirmForm({ onSuccess, onCancel, editData = null }) {
  const theme = useTheme();
  const [form, setForm] = useState(editData ? { firm_name: editData.firm_name || "", gstin: editData.gstin || "", address: editData.address || "", city: editData.city || "", state: editData.state || "", pincode: editData.pincode || "", phone: editData.phone || "", logo_url: editData.logo_url || "", isDefault: editData.isDefault || false, is_active: editData.is_active ?? true } : initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: name === "gstin" ? value.toUpperCase() : value })); setError(""); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const payload = editData ? form : (({ is_active, ...rest }) => rest)(form); const res = editData ? await apiRequest.put(`/company/edit/${editData._id}`, payload) : await apiRequest.post("/company/create", payload); onSuccess(res.data.data); }
    catch (err) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px" }}>Basic Information</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Firm Name" name="firm_name" value={form.firm_name} onChange={handleChange} required size="small" />
        <TextField label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} size="small" inputProps={{ maxLength: 15, style: { textTransform: "uppercase" } }} />
        <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} size="small" inputProps={{ maxLength: 10 }} />
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField label="Logo URL" name="logo_url" value={form.logo_url} onChange={handleChange} size="small" placeholder="https://..." fullWidth />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: "150px" }}>
          <Typography variant="body2" fontWeight={600}>Default Firm</Typography>
          <Switch checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} color="primary" />
        </Box>
      </Box>
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px", mt: 1 }}>Address Details</Typography>
      <TextField label="Address" name="address" value={form.address} onChange={handleChange} required size="small" fullWidth multiline rows={2} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
        <TextField label="City" name="city" value={form.city} onChange={handleChange} size="small" />
        <TextField label="State" name="state" value={form.state} onChange={handleChange} size="small" />
        <TextField label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} size="small" inputProps={{ maxLength: 6 }} />
      </Box>
      {editData && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
          <Box><Typography variant="body2" fontWeight={600}>Status</Typography><Typography variant="body2" fontSize="12px" color={form.is_active ? "success.main" : "error.main"}>{form.is_active ? "Active" : "Inactive"}</Typography></Box>
          <Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} color="success" />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>{loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editData ? "Save Changes" : "Create Firm"}</Button>
      </Box>
    </Box>
  );
}

export default function ManageFirm() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFirm, setEditFirm] = useState(null);
  const [viewFirm, setViewFirm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { refreshFirms } = useAuth();
  const theme = useTheme();

  const fetchFirms = async () => { setLoading(true); try { const res = await apiRequest.get("/company/my-firms"); setFirms(res.data.data); } catch { setFirms([]); } finally { setLoading(false); } };
  useEffect(() => { fetchFirms(); }, []);

  const handleCreateSuccess = (f) => { setCreateOpen(false); setFirms((p) => [f, ...p]); refreshFirms(); };
  const handleEditSuccess = (f) => { setEditFirm(null); setFirms((p) => p.map((x) => x._id === f._id ? f : x)); refreshFirms(); };
  const handleDelete = async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await apiRequest.delete(`/company/delete/${deleteTarget._id}`); setFirms((p) => p.filter((f) => f._id !== deleteTarget._id)); setDeleteTarget(null); refreshFirms(); } catch { } finally { setDeleteLoading(false); } };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Firms</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>All your registered firms</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddBusinessIcon />} onClick={() => setCreateOpen(true)}>Create Firm</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={170} sx={{ borderRadius: "16px" }} />)}</Box>
      ) : firms.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}><BusinessOutlinedIcon sx={{ color: "#4F46E5", fontSize: 30 }} /></Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No firms yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Create your first firm to get started</Typography>
          <Button variant="contained" startIcon={<AddBusinessIcon />} onClick={() => setCreateOpen(true)}>Create Firm</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>
          {firms.map((firm) => (
            <Paper key={firm._id} elevation={0} onClick={() => setViewFirm(firm)} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "16px", p: 2.5, transition: "all 0.2s ease", cursor: "pointer", "&:hover": { borderColor: theme.palette.primary.light, boxShadow: "0 12px 24px rgba(0,0,0,0.05)", transform: "translateY(-2px)" } }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", background: firm.logo_url ? "transparent" : "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: firm.logo_url ? `1px solid ${theme.palette.divider}` : "none" }}>
                  {firm.logo_url ? (
                    <Box component="img" src={firm.logo_url} sx={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <BusinessOutlinedIcon sx={{ color: "#fff", fontSize: 20, display: firm.logo_url ? "none" : "block" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.primary" noWrap>{firm.firm_name}</Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                    <Chip label={firm.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={firm.is_active ? "success" : "error"} sx={{ height: 20, fontSize: "10px", fontWeight: 700 }} />
                    {firm.isDefault && <Chip label="Default" size="small" color="primary" sx={{ height: 20, fontSize: "10px", fontWeight: 700 }} />}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditFirm(firm); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main } }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(firm); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: "#EF4444" } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {firm.gstin && <Typography variant="body2" color="text.secondary"><FingerprintIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{firm.gstin}</Typography>}
                {firm.phone && <Typography variant="body2" color="text.secondary"><PhoneOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{firm.phone}</Typography>}
                {firm.address && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}><LocationOnOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{[firm.address, firm.city, firm.state, firm.pincode].filter(Boolean).join(", ")}</Typography>}
                {(firm.total_inward > 0 || firm.total_outward > 0) && (
                  <Typography variant="body2" color="primary.main" sx={{ mt: 0.5, fontWeight: 700, fontSize: "12px" }}>
                    Inward: {firm.total_inward?.toLocaleString()} | Outward: {firm.total_outward?.toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Create Firm</Typography><IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}><FirmForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} /></DialogContent>
      </Dialog>

      <Dialog open={Boolean(editFirm)} onClose={() => setEditFirm(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Edit Firm</Typography><IconButton size="small" onClick={() => setEditFirm(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}>{editFirm && <FirmForm onSuccess={handleEditSuccess} onCancel={() => setEditFirm(null)} editData={editFirm} />}</DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: "error.light", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}><WarningAmberIcon sx={{ color: "#fff", fontSize: 28 }} /></Box>
          <Typography variant="h6">Delete Firm?</Typography>
          <Typography variant="body2" color="text.secondary">Are you sure you want to delete <strong>{deleteTarget?.firm_name}</strong>? This cannot be undone.</Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleDelete} disabled={deleteLoading} color="error">{deleteLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}</Button>
        </DialogActions>
      </Dialog>

      {/* Firm Details Popup */}
      <Dialog open={Boolean(viewFirm)} onClose={() => setViewFirm(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={700}>Firm Details</Typography>
          <IconButton size="small" onClick={() => setViewFirm(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          {viewFirm && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "18px", background: viewFirm.logo_url ? "transparent" : "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: viewFirm.logo_url ? `1px solid ${theme.palette.divider}` : "none", boxShadow: viewFirm.logo_url ? "none" : "0 8px 16px rgba(79, 70, 229, 0.2)" }}>
                  {viewFirm.logo_url ? (
                    <Box component="img" src={viewFirm.logo_url} sx={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <BusinessOutlinedIcon sx={{ color: "#fff", fontSize: 32, display: viewFirm.logo_url ? "none" : "block" }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">{viewFirm.firm_name}</Typography>
                  <Chip label={viewFirm.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={viewFirm.is_active ? "success" : "error"} sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Registration</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}><FingerprintIcon sx={{ fontSize: 18, color: "primary.main" }} />{viewFirm.gstin || "Not provided"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Contact</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}><PhoneOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />{viewFirm.phone || "Not provided"}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Location</Typography>
                <Box sx={{ mt: 1, p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <LocationOnOutlinedIcon sx={{ color: "primary.main", mt: 0.25 }} />
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                    {viewFirm.address}<br />
                    <strong>{viewFirm.city}</strong>, {viewFirm.state} - {viewFirm.pincode}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button fullWidth variant="contained" onClick={() => { setEditFirm(viewFirm); setViewFirm(null); }} startIcon={<EditOutlinedIcon />}>Edit Firm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
