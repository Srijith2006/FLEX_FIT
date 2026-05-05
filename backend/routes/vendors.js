import express from "express";
import {
  registerVendor,
  getMyVendorProfile,
  updateVendorProfile,
  uploadCertificate,
  createProduct,
  myProducts,
  updateProduct,
  deleteProduct,
  listAllVendors,
  reviewVendor,
} from "../controllers/vendorController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ── Vendor Profile Setup & Management ─────────────────────────────────────────
// POST /api/vendors/register — vendor fills business details on first dashboard visit
router.post("/register",              protect, authorize("vendor"), registerVendor);
router.get("/me",                     protect, authorize("vendor"), getMyVendorProfile);
router.put("/me",                     protect, authorize("vendor"), updateVendorProfile);

// ── Certificate Upload ─────────────────────────────────────────────────────────
// PUT /api/vendors/me/certificate — uploads license/FSSAI cert; admin can then view & approve
router.put("/me/certificate",         protect, authorize("vendor"), upload.single("certificate"), uploadCertificate);

// ── Product Management (approved vendors only — enforced in controller) ─────────
router.post("/products",              protect, authorize("vendor"), createProduct);
router.get("/products/mine",          protect, authorize("vendor"), myProducts);
router.put("/products/:productId",    protect, authorize("vendor"), updateProduct);
router.delete("/products/:productId", protect, authorize("vendor"), deleteProduct);

// ── Admin Routes ───────────────────────────────────────────────────────────────
// GET  /api/vendors/all          — list all vendors with certificate URLs
// PATCH /api/vendors/:id/review  — approve or reject a vendor
router.get("/all",                    protect, authorize("admin"), listAllVendors);
router.patch("/:vendorId/review",     protect, authorize("admin"), reviewVendor);