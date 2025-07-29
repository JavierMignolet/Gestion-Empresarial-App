import fs from "fs";
const ruta = "./src/data/productos.json";

const leer = () => JSON.parse(fs.readFileSync(ruta, "utf-8"));
const guardar = (data) => fs.writeFileSync(ruta, JSON.stringify(data, null, 2));

export const getProductos = (req, res) => {
  const productos = leer();
  res.json(productos);
};

export const crearProducto = (req, res) => {
  const productos = leer();
  const nuevo = { id: Date.now(), ...req.body };
  productos.push(nuevo);
  guardar(productos);
  res.status(201).json(nuevo);
};

export const actualizarProducto = (req, res) => {
  const productos = leer();
  const id = parseInt(req.params.id);
  const index = productos.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ message: "No encontrado" });

  productos[index] = { ...productos[index], ...req.body };
  guardar(productos);
  res.json(productos[index]);
};

export const eliminarProducto = (req, res) => {
  const productos = leer();
  const id = parseInt(req.params.id);
  const nuevos = productos.filter((p) => p.id !== id);
  guardar(nuevos);
  res.json({ message: "Producto eliminado" });
};
