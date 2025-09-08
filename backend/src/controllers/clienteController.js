// src/controllers/clienteController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const FILE = "/clientes.json";

const safeRead = () => {
  const d = readJSON(FILE);
  return Array.isArray(d) ? d : [];
};

const save = (arr) => writeJSON(FILE, Array.isArray(arr) ? arr : []);

const nextId = (arr) =>
  arr.length ? Math.max(...arr.map((x) => +x.id || 0)) + 1 : 1;

// ====== HANDLERS ======
export const getClientes = (_req, res) => {
  try {
    res.json(safeRead());
  } catch (err) {
    console.error("❌ getClientes:", err);
    res.status(500).json({ message: "No se pudieron leer los clientes" });
  }
};

export const crearCliente = (req, res) => {
  try {
    const clientes = safeRead();
    const { id: _ignorarId, ...rest } = req.body || {};

    const nuevo = {
      id: nextId(clientes),
      nombre: rest.nombre || "",
      cuit_dni: rest.cuit_dni || "",
      direccion: rest.direccion || "",
      telefono: rest.telefono || "",
      email: rest.email || "",
      condicion_iva: rest.condicion_iva || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    clientes.push(nuevo);
    save(clientes);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error("❌ crearCliente:", err);
    res.status(500).json({ message: "No se pudo crear el cliente" });
  }
};

export const actualizarCliente = (req, res) => {
  try {
    const clientes = safeRead();
    const id = Number(req.params.id);
    const idx = clientes.findIndex((c) => Number(c.id) === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const { id: _ignorarId, ...rest } = req.body || {};
    clientes[idx] = {
      ...clientes[idx],
      ...rest,
      updatedAt: new Date().toISOString(),
    };

    save(clientes);
    res.json(clientes[idx]);
  } catch (err) {
    console.error("❌ actualizarCliente:", err);
    res.status(500).json({ message: "No se pudo actualizar el cliente" });
  }
};

export const eliminarCliente = (req, res) => {
  try {
    const clientes = safeRead();
    const id = Number(req.params.id);
    if (!clientes.some((c) => Number(c.id) === id)) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    const nuevos = clientes.filter((c) => Number(c.id) !== id);
    save(nuevos);
    res.json({ ok: true, message: "Cliente eliminado" });
  } catch (err) {
    console.error("❌ eliminarCliente:", err);
    res.status(500).json({ message: "No se pudo eliminar el cliente" });
  }
};
