import fs from "fs";
const rutaClientes = "./src/data/clientes.json";

const leerClientes = () => JSON.parse(fs.readFileSync(rutaClientes, "utf-8"));
const guardarClientes = (data) =>
  fs.writeFileSync(rutaClientes, JSON.stringify(data, null, 2));

// GET /api/clientes
export const getClientes = (req, res) => {
  const clientes = leerClientes();
  res.json(clientes);
};

// POST /api/clientes
export const crearCliente = (req, res) => {
  const clientes = leerClientes();
  const nuevoCliente = { id: Date.now(), ...req.body };
  clientes.push(nuevoCliente);
  guardarClientes(clientes);
  res.status(201).json(nuevoCliente);
};

// PUT /api/clientes/:id
export const actualizarCliente = (req, res) => {
  const clientes = leerClientes();
  const id = parseInt(req.params.id);
  const index = clientes.findIndex((c) => c.id === id);

  if (index === -1)
    return res.status(404).json({ message: "Cliente no encontrado" });

  clientes[index] = { ...clientes[index], ...req.body };
  guardarClientes(clientes);
  res.json(clientes[index]);
};

// DELETE /api/clientes/:id
export const eliminarCliente = (req, res) => {
  const clientes = leerClientes();
  const id = parseInt(req.params.id);
  const nuevos = clientes.filter((c) => c.id !== id);
  guardarClientes(nuevos);
  res.json({ message: "Cliente eliminado" });
};
