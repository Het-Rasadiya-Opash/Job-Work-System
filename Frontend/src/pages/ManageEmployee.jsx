import { useState, useEffect } from "react";
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

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import apiRequest from "../utils/ApiRequest";

const initialForm = { name: "", phone: "", role: "" };

function EmployeeForm({ onSuccess, onCancel, activeFirm, editData = null }) {
  const theme = useTheme();
  const [form, setForm] = useState(editData ? { name: editData.name || "", phone: editData.phone || "", role: editData.role || "", is_active: editData.is_active ?? true } : initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(""); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const payload = { ...form, company_id: activeFirm?._id }; const res = editData ? await apiRequest.put(`/employee/${editData._id}`, payload) : await apiRequest.post("/employee", payload); onSuccess(res.data.data); }
    catch (err) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px" }}>Basic Information</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} required size="small" />
        <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} size="small" inputProps={{ maxLength: 10 }} />
        <TextField label="Role/Job Title" name="role" value={form.role} onChange={handleChange} size="small" />
      </Box>
      {editData && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
          <Box><Typography variant="body2" fontWeight={600}>Status</Typography><Typography variant="body2" fontSize="12px" color={form.is_active ? "success.main" : "error.main"}>{form.is_active ? "Active" : "Inactive"}</Typography></Box>
          <Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} color="success" />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>{loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editData ? "Save Changes" : "Add Employee"}</Button>
      </Box>
    </Box>
  );
}

export default function ManageEmployee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { activeFirm } = useAuth();
  const theme = useTheme();

  const fetchEmployees = async () => { if (!activeFirm?._id) return; setLoading(true); try { const res = await apiRequest.get("/employee", { params: { company_id: activeFirm._id } }); setEmployees(res.data.data || []); } catch { setEmployees([]); } finally { setLoading(false); } };
  useEffect(() => { fetchEmployees(); }, [activeFirm]);

  const handleCreateSuccess = (e) => { setCreateOpen(false); fetchEmployees(); };
  const handleEditSuccess = (e) => { setEditEmployee(null); fetchEmployees(); };
  const handleDelete = async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await apiRequest.delete(`/employee/${deleteTarget._id}`, { params: { company_id: activeFirm._id } }); setEmployees((p) => p.filter((e) => e._id !== deleteTarget._id)); setDeleteTarget(null); } catch {} finally { setDeleteLoading(false); } };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Employees</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Manage your factory workforce</Typography>
        </Box>
        <Button variant="contained" startIcon={<BadgeOutlinedIcon />} onClick={() => setCreateOpen(true)}>Add Employee</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: "16px" }} />)}</Box>
      ) : employees.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}><BadgeOutlinedIcon sx={{ color: "#4F46E5", fontSize: 30 }} /></Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No employees yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Add your first employee to start tracking production</Typography>
          <Button variant="contained" startIcon={<BadgeOutlinedIcon />} onClick={() => setCreateOpen(true)}>Add Employee</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>
          {employees.map((e) => (
            <Paper key={e._id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "16px", p: 2.5, transition: "all 0.2s ease", "&:hover": { borderColor: theme.palette.primary.light, boxShadow: "0 12px 24px rgba(0,0,0,0.05)", transform: "translateY(-2px)" } }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PersonOutlineIcon sx={{ color: "#4F46E5", fontSize: 20 }} /></Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.primary" noWrap>{e.name}</Typography>
                  <Chip label={e.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={e.is_active ? "success" : "error"} sx={{ mt: 0.5, height: 20, fontSize: "10px", fontWeight: 700 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditEmployee(e)} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main } }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(e)} sx={{ color: theme.palette.text.secondary, "&:hover": { color: "#EF4444" } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {e.phone && <Typography variant="body2" color="text.secondary"><PhoneOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{e.phone}</Typography>}
                {e.role && <Typography variant="body2" color="text.secondary"><BadgeOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />{e.role}</Typography>}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Add Employee</Typography><IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}><EmployeeForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} activeFirm={activeFirm} /></DialogContent>
      </Dialog>

      <Dialog open={Boolean(editEmployee)} onClose={() => setEditEmployee(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Edit Employee</Typography><IconButton size="small" onClick={() => setEditEmployee(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}>{editEmployee && <EmployeeForm onSuccess={handleEditSuccess} onCancel={() => setEditEmployee(null)} activeFirm={activeFirm} editData={editEmployee} />}</DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: "error.light", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}><WarningAmberIcon sx={{ color: "#fff", fontSize: 28 }} /></Box>
          <Typography variant="h6">Delete Employee?</Typography>
          <Typography variant="body2" color="text.secondary">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleDelete} disabled={deleteLoading} color="error">{deleteLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
