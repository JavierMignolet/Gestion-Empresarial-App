import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Productos() {
  const { token } = useAuth();
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    tipo: "",
    presentacion: "",
    precio_costo: "",
    precio_venta: "",
    stock: 0,
  });

  const fetchProductos = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductos(res.data);
    } catch (err) {
      setError("No se pudieron cargar los productos");
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openNuevo = () => {
    setEditMode(false);
    setFormData({
      id: null,
      nombre: "",
      tipo: "",
      presentacion: "",
      precio_costo: "",
      precio_venta: "",
      stock: 0,
    });
    setShowModal(true);
  };

  const openEditar = (producto) => {
    setEditMode(true);
    setFormData(producto);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `http://localhost:4000/api/productos/${formData.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(`http://localhost:4000/api/productos`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchProductos();
    } catch (err) {
      setError("Error al guardar el producto");
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar este producto?")) {
      try {
        await axios.delete(`http://localhost:4000/api/productos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchProductos();
      } catch (err) {
        setError("Error al eliminar el producto");
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Productos</h3>
        <button className="btn btn-primary" onClick={openNuevo}>
          Agregar producto
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {productos.length === 0 ? (
        <p>No hay productos cargados aún.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Presentación</th>
                <th>Precio costo</th>
                <th>Precio venta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p, index) => (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td>{p.nombre}</td>
                  <td>{p.tipo}</td>
                  <td>{p.presentacion}</td>
                  <td>${p.precio_costo}</td>
                  <td>${p.precio_venta}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openEditar(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarProducto(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editMode ? "Editar producto" : "Nuevo producto"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {[
                  "nombre",
                  "tipo",
                  "presentacion",
                  "precio_costo",
                  "precio_venta",
                  "stock",
                ].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">
                      {field.replace("_", " ").toUpperCase()}
                    </label>
                    <input
                      type={field === "stock" ? "number" : "text"}
                      name={field}
                      className="form-control"
                      value={formData[field]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;
