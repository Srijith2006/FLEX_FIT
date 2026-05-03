import express from "express";
import {
  registerVendor, getMyVendorProfile, updateVendorProfile,
  createProduct, myProducts, updateProduct, deleteProduct,
  listAllVendors, reviewVendor,
} from "../controllers/vendorController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register",            protect, authorize("vendor"), registerVendor);
router.get("/me",                   protect, authorize("vendor"), getMyVendorProfile);
router.put("/me",                   protect, authorize("vendor"), updateVendorProfile);
router.get("/all",                  protect, authorize("admin"),  listAllVendors);
router.patch("/:vendorId/review",   protect, authorize("admin"),  reviewVendor);
router.post("/products",            protect, authorize("vendor"), createProduct);
router.get("/products/mine",        protect, authorize("vendor"), myProducts);
router.put("/products/:productId",  protect, authorize("vendor"), updateProduct);
router.delete("/products/:productId", protect, authorize("vendor"), deleteProduct);

export default router;