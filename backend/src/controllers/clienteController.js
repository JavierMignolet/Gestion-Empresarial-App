// src/controllers/clienteControlller.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const rutaClientes = "./src/data/clientes.json";

const leerClientes = () => readJSON(rutaClientes) || [];
const guardarClientes = (data) => writeJSON(rutaClientes, data || []);

const calcularSiguienteId = (clientes) => {
  const ids = clientes
    .map((c) => Number(c.id))
    .filter((n) => Number.isFinite(n) && n >= 1);
  const maxId = ids.length ? Math.max(...ids) : 0;
  return maxId + 1;
};

// GET
export const getClientes = (req, res) => {
  const clientes = leerClientes();
  res.json(clientes);
};

// POST
export const crearCliente = (req, res) => {
  const clientes = leerClientes();
  const { id: _ignorarId, ...rest } = req.body;

  const nuevoCliente = { id: calcularSiguienteId(clientes), ...rest };
  clientes.push(nuevoCliente);
  guardarClientes(clientes);
  res.status(201).json(nuevoCliente);
};

// PUT
export const actualizarCliente = (req, res) => {
  const clientes = leerClientes();
  const id = parseInt(req.params.id, 10);
  const index = clientes.findIndex((c) => Number(c.id) === id);
  if (index === -1)
    return res.status(404).json({ message: "Cliente no encontrado" });

  const { id: _ignorarId, ...rest } = req.body;
  clientes[index] = { ...clientes[index], ...rest };
  guardarClientes(clientes);
  res.json(clientes[index]);
};

// DELETE
export const eliminarCliente = (req, res) => {
  const clientes = leerClientes();
  const id = parseInt(req.params.id, 10);
  const existe = clientes.some((c) => Number(c.id) === id);
  if (!existe)
    return res.status(404).json({ message: "Cliente no encontrado" });

  const nuevos = clientes.filter((c) => Number(c.id) !== id);
  guardarClientes(nuevos);
  res.json({ message: "Cliente eliminado" });
};
