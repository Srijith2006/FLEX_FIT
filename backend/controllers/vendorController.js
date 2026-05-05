import { Vendor, Product, User } from "../models/index.js";

// ── Vendor Registration ────────────────────────────────────────────────────────
export const registerVendor = async (req, res, next) => {
  try {
    const existing = await Vendor.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ message: "Vendor profile already exists" });

    const { businessName, businessType, description, phone, address, city, gstNumber } = req.body;
    if (!businessName) return res.status(400).json({ message: "businessName is required" });

    const vendor = await Vendor.create({
      user: req.user._id, businessName, businessType, description,
      phone, address, city, gstNumber,
    });
    res.status(201).json({ vendor });
  } catch (error) { next(error); }
};

export const getMyVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id }).populate("user", "name email");
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
    res.json({ vendor });
  } catch (error) { next(error); }
};

export const updateVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
    const fields = ["businessName","businessType","description","phone","address","city","gstNumber"];
    fields.forEach(f => { if (req.body[f] !== undefined) vendor[f] = req.body[f]; });
    await vendor.save();
    res.json({ vendor });
  } catch (error) { next(error); }
};

// ── Vendor Products ────────────────────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    if (vendor.verificationStatus !== "approved")
      return res.status(403).json({ message: "Only verified vendors can list products" });

    const { name, description, category, price, unit, stock, calories, protein, carbs, fat,
            groupBuyEnabled, groupBuyThreshold, groupBuyDiscount } = req.body;
    if (!name || !price) return res.status(400).json({ message: "name and price are required" });

    const product = await Product.create({
      vendor: vendor._id, name, description, category,
      price: Number(price), unit, stock: Number(stock)||0,
      calories: Number(calories)||0, protein: Number(protein)||0,
      carbs: Number(carbs)||0, fat: Number(fat)||0,
      groupBuyEnabled: Boolean(groupBuyEnabled),
      groupBuyThreshold: Number(groupBuyThreshold)||10,
      groupBuyDiscount: Number(groupBuyDiscount)||15,
    });
    res.status(201).json({ product });
  } catch (error) { next(error); }
};

export const myProducts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.json({ products: [] });
    const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, vendor: vendor._id },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    await Product.findOneAndDelete({ _id: req.params.productId, vendor: vendor._id });
    res.json({ message: "Product deleted" });
  } catch (error) { next(error); }
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const listAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({}).populate("user","name email").sort({ createdAt: -1 });
    res.json({ vendors });
  } catch (error) { next(error); }
};

export const reviewVendor = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved","rejected"].includes(status))
      return res.status(400).json({ message: "Status must be approved or rejected" });

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { verificationStatus: status, rejectionReason: rejectionReason || "" },
      { new: true }
    ).populate("user","name email");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json({ vendor });
  } catch (error) { next(error); }
};