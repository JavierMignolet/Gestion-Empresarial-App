import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const usuariosPath = "./src/data/usuarios.json";

export const login = (req, res) => {
  try {
    const { username, password } = req.body;
    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));

    console.log("Usuarios cargados:", usuarios);
    console.log("Buscando usuario:", username);
    console.log("🔐 JWT_SECRET desde .env:", process.env.JWT_SECRET);

    const usuario = usuarios.find((u) => u.username === username);

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const passwordValida = bcrypt.compareSync(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({
      token,
      username: usuario.username,
      role: usuario.role,
    });
  } catch (error) {
    console.error("Error en login:", error);
  }
};
