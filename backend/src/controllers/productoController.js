// src/controllers/productoController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const ruta = "./src/data/productos.json";

const leer = () => readJSON(ruta) || [];
const guardar = (data) => writeJSON(ruta, data || []);

// GET
export const getProductos = (req, res) => {
  try {
    const productos = (leer() || []).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    res.json(productos);
  } catch (error) {
    console.error("Error al leer productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

// POST
export const crearProducto = (req, res) => {
  try {
    const {
      nombre,
      tipo,
      presentacion,
      precio_consumidor,
      precio_minorista,
      precio_mayorista,
    } = req.body;

    if (!nombre || !tipo || !presentacion) {
      return res
        .status(400)
        .json({
          message: "Faltan campos obligatorios: nombre, tipo o presentación",
        });
    }

    const productos = leer();
    const nextId =
      productos.length > 0
        ? Math.max(...productos.map((p) => Number(p.id) || 0)) + 1
        : 1;

    const nuevoProducto = {
      id: nextId,
      nombre,
      tipo,
      presentacion,
      precio_costo: 0,
      stock: 0,
      precio_consumidor: parseFloat(precio_consumidor) || 0,
      precio_minorista: parseFloat(precio_minorista) || 0,
      precio_mayorista: parseFloat(precio_mayorista) || 0,
    };

    productos.push(nuevoProducto);
    guardar(productos.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ message: "Error al crear producto" });
  }
};

// PUT
export const actualizarProducto = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nombre,
      tipo,
      presentacion,
      precio_consumidor,
      precio_minorista,
      precio_mayorista,
    } = req.body;

    const productos = leer();
    const index = productos.findIndex((p) => Number(p.id) === id);
    if (index === -1)
      return res.status(404).json({ message: "Producto no encontrado" });

    productos[index] = {
      ...productos[index],
      nombre: nombre ?? productos[index].nombre,
      tipo: tipo ?? productos[index].tipo,
      presentacion: presentacion ?? productos[index].presentacion,
      precio_consumidor:
        precio_consumidor !== undefined
          ? parseFloat(precio_consumidor) || 0
          : productos[index].precio_consumidor,
      precio_minorista:
        precio_minorista !== undefined
          ? parseFloat(precio_minorista) || 0
          : productos[index].precio_minorista,
      precio_mayorista:
        precio_mayorista !== undefined
          ? parseFloat(precio_mayorista) || 0
          : productos[index].precio_mayorista,
    };

    guardar(productos.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));
    res.json(productos[index]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ message: "Error al actualizar producto" });
  }
};

// DELETE
export const eliminarProducto = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const productos = leer();
    const nuevos = productos.filter((p) => Number(p.id) !== id);
    guardar(nuevos.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
};
