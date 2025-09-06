// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Chequeo extra: debe coincidir empresa en header (si viene)
    const headerEmpresa = req.headers["x-company"];
    if (
      decoded?.empresa &&
      headerEmpresa &&
      decoded.empresa !== headerEmpresa
    ) {
      return res
        .status(403)
        .json({ message: "Empresa inválida para este token" });
    }
    req.user = decoded; // { id, username, role, empresa }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token inválido" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado: solo admin" });
  }
  next();
};
