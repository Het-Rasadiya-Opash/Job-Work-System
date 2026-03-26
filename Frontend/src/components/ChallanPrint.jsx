import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import apiRequest from "../utils/ApiRequest";
import { formatDate } from "../utils/dateUtils";

export default function ChallanPrint() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company_id");
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme();

  useEffect(() => {
    if (id && companyId) {
      apiRequest.get(`/challan/${id}/print?company_id=${companyId}`)
        .then(res => {
          setData(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          setError(err?.response?.data?.message || "Failed to load challan data");
          setLoading(false);
        });
    }
  }, [id, companyId]);

  if (loading) return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2, bgcolor: "#fff" }}>
      <CircularProgress size={40} />
      <Typography color="text.secondary">Preparing Challan for print...</Typography>
    </Box>
  );

  if (error || !data) return (
    <Box sx={{ p: 4, textAlign: "center", bgcolor: "#fff", minHeight: "100vh" }}>
      <Typography color="error" variant="h6">{error || "Challan not found"}</Typography>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Box>
  );

  const { firm, vepari, design, job_card, challan_number, challan_type, pieces, vehicle_number, created_at, notes } = data;

  return (
    <Box sx={{ bgcolor: "#fff", color: "#000", minHeight: "100vh" }}>
      {/* Action Bar - Hidden during print */}
      <Box sx={{ 
        p: 2, 
        borderBottom: "1px solid #eee", 
        display: "flex", 
        justifyContent: "space-between", 
        mb: 2, 
        "@media print": { display: "none" },
        bgcolor: "#f9fafb" 
      }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: "#374151" }}>Back to Dashboard</Button>
        <Button startIcon={<PrintIcon />} variant="contained" onClick={() => window.print()} sx={{ bgcolor: "#111827", "&:hover": { bgcolor: "#000" } }}>Print Challan</Button>
      </Box>

      {/* Actual Challan Content */}
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 850, mx: "auto" }}>
        <Paper elevation={0} sx={{ 
          p: 6, 
          border: "1px solid #ddd", 
          borderRadius: "0px",
          minHeight: "1000px",
          bgcolor: "#fff",
          "@media print": {
            border: "none",
            p: 0,
            m: 0,
            width: "100%",
            boxShadow: "none"
          }
        }}>
          {/* Header Section */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e40af", mb: 0.5, fontSize: "28px", letterSpacing: "-0.5px" }}>
                {firm.name?.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 350, lineHeight: 1.5, color: "#374151" }}>
                {firm.address}, {firm.city}<br />
                {firm.state} - {firm.pincode}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5, color: "#374151" }}>
                <strong>Phone:</strong> {firm.phone}<br />
                {firm.gstin && <><strong>GSTIN:</strong> {firm.gstin}</>}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "#111827", fontSize: "22px" }}>
                {challan_type} CHALLAN
              </Typography>
              <Typography variant="body2" sx={{ color: "#374151" }}>
                <strong>No:</strong> {challan_number}<br />
                <strong>Date:</strong> {formatDate(created_at)}<br />
                <strong>Time:</strong> {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4, borderColor: "#000", borderWidth: "1.5px" }} />

          {/* Parties Section */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, mb: 6 }}>
            <Box>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 800, color: "#6b7280", fontSize: "11px", display: "block", mb: 1.5 }}>
                Receiver Details
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, fontSize: "16px" }}>{vepari.name}</Typography>
              {vepari.company_name && <Typography variant="body2" sx={{ fontWeight: 600 }}>{vepari.company_name}</Typography>}
              <Typography variant="body2" sx={{ mt: 1, color: "#374151" }}>{vepari.address}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Phone:</strong> {vepari.phone}</Typography>
              {vepari.gstin && <Typography variant="body2"><strong>GSTIN:</strong> {vepari.gstin}</Typography>}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 800, color: "#6b7280", fontSize: "11px", display: "block", mb: 1.5 }}>
                Logistics & Ref.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Vehicle No:</strong> {vehicle_number || "—"}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Job Card No:</strong> {job_card.number}</Typography>
              <Typography variant="body2"><strong>Design Number:</strong> {design.number}</Typography>
            </Box>
          </Box>

          {/* Items Table */}
          <Box sx={{ mb: 8 }}>
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: "60px 1fr 120px", 
              py: 2, 
              borderTop: "2px solid #000",
              borderBottom: "2px solid #000", 
              fontWeight: 800, 
              fontSize: "13px",
              bgcolor: "#f3f4f6",
              px: 1,
              "@media print": { bgcolor: "transparent" }
            }}>
              <Box>SR.</Box>
              <Box>DESCRIPTION OF SERVICES</Box>
              <Box sx={{ textAlign: "right" }}>QTY (PCS)</Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "60px 1fr 120px", py: 3, borderBottom: "1px solid #000", fontSize: "15px", px: 1 }}>
              <Box>1.</Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Embroidery Job Work</Typography>
                <Typography variant="body2" sx={{ color: "#4b5563", mt: 0.5 }}>
                  Design: <strong>{design.number}</strong> | Stitches: {design.stitch_count}
                </Typography>
                {notes && <Typography variant="body2" sx={{ mt: 1.5, fontStyle: "italic", bgcolor: "#f9fafb", p: 1, borderRadius: 1, "@media print": { p: 0 } }}>Note: {notes}</Typography>}
              </Box>
              <Box sx={{ textAlign: "right", fontWeight: 800, fontSize: "18px" }}>{pieces}</Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 120px", py: 2.5, fontWeight: 900, px: 1 }}>
              <Box sx={{ textAlign: "right", pr: 3 }}>NET TOTAL PIECES:</Box>
              <Box sx={{ textAlign: "right", fontSize: "18px" }}>{pieces} PCS</Box>
            </Box>
          </Box>

          {/* Signatures */}
          <Box sx={{ mt: "auto", pt: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ textAlign: "center", minWidth: 220 }}>
                <Box sx={{ height: 60 }} />
                <Divider sx={{ borderColor: "#000", mb: 1, borderWidth: "1px" }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Receiver's Signature</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: 220 }}>
                <Typography variant="caption" sx={{ mb: 1.5, display: "block", fontWeight: 700 }}>For, {firm.name?.toUpperCase()}</Typography>
                <Box sx={{ height: 60 }} />
                <Divider sx={{ borderColor: "#000", mb: 1, borderWidth: "1px" }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Authorized Signatory</Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 8, color: "#9ca3af", fontSize: "10px" }}>
              Thank you for your business. Computer Generated Document.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
