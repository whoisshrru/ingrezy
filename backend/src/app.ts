import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import storeRoutes from "./routes/store.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import retailerRoutes from "./routes/retailer.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// Base route
app.get("/", (_req, res) => {
  res.send("Ingrezy Backend is running!");
});

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Ingrezy API and Database are healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Database health check error:",
      error instanceof Error ? error.message : "Unknown database error"
    );
    res.status(503).json({
      success: false,
      message: "API is running but Database connection is unavailable",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// Route Mounts
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/retailer", retailerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);

export default app;
