// src/pages/Productos.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

const fmtMoney = (v) =>
  `$${Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function Productos() {
  const { token } = useAuth();
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    tipo: "",
    presentacion: "",
    precio_consumidor: "",
    precio_minorista: "",
    precio_mayorista: "",
  });

  const resetForm = () =>
    setFormData({
      id: null,
      nombre: "",
      tipo: "",
      presentacion: "",
      precio_consumidor: "",
      precio_minorista: "",
      precio_mayorista: "",
    });

  const fetchProductos = async () => {
    try {
      const res = await axiosAuth.get("/api/productos");
      setProductos(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("GET /api/productos", err);
      setProductos([]);
      setError(
        err?.response?.data?.message || "No se pudieron cargar los productos."
      );
    }
  };

  useEffect(() => {
    if (token) fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // mantenemos como string para inputs controlados; convertimos al guardar
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openNuevo = () => {
    setEditMode(false);
    resetForm();
    setShowModal(true);
  };

  const openEditar = (producto) => {
    setEditMode(true);
    setFormData({
      id: producto.id,
      nombre: producto.nombre || "",
      tipo: producto.tipo || "",
      presentacion: producto.presentacion || "",
      precio_consumidor: producto.precio_consumidor ?? "",
      precio_minorista: producto.precio_minorista ?? "",
      precio_mayorista: producto.precio_mayorista ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const payload = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      presentacion: formData.presentacion,
      precio_consumidor:
        formData.precio_consumidor === ""
          ? ""
          : parseFloat(formData.precio_consumidor),
      precio_minorista:
        formData.precio_minorista === ""
          ? ""
          : parseFloat(formData.precio_minorista),
      precio_mayorista:
        formData.precio_mayorista === ""
          ? ""
          : parseFloat(formData.precio_mayorista),
    };

    try {
      if (editMode) {
        await axiosAuth.put(`/api/productos/${formData.id}`, payload);
        setOkMsg("✅ Producto actualizado.");
      } else {
        await axiosAuth.post("/api/productos", payload);
        setOkMsg("✅ Producto creado.");
      }
      setShowModal(false);
      resetForm();
      fetchProductos();
      setTimeout(() => setOkMsg(""), 2200);
    } catch (err) {
      console.error("SAVE /api/productos", err);
      setError(err?.response?.data?.message || "Error al guardar el producto.");
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este producto?")) return;
    try {
      await axiosAuth.delete(`/api/productos/${id}`);
      fetchProductos();
    } catch (err) {
      console.error("DELETE /api/productos", err);
      setError(
        err?.response?.data?.message || "Error al eliminar el producto."
      );
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

      {okMsg && <div className="alert alert-success">{okMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {productos.length === 0 ? (
        <p>No hay productos cargados aún.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Presentación</th>
                <th>Precio Final</th>
                <th>Precio Minorista</th>
                <th>Precio Mayorista</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.tipo}</td>
                  <td>{p.presentacion}</td>
                  <td>{fmtMoney(p.precio_consumidor)}</td>
                  <td>{fmtMoney(p.precio_minorista)}</td>
                  <td>{fmtMoney(p.precio_mayorista)}</td>
                  <td className="text-nowrap">
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
                />
              </div>

              <div className="modal-body">
                {[
                  ["nombre", "text"],
                  ["tipo", "text"],
                  ["presentacion", "text"],
                  ["precio_consumidor", "number"],
                  ["precio_minorista", "number"],
                  ["precio_mayorista", "number"],
                ].map(([field, type]) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">
                      {field.replace("_", " ").toUpperCase()}
                    </label>
                    <input
                      type={type}
                      name={field}
                      className="form-control"
                      value={formData[field]}
                      onChange={handleChange}
                      {...(type === "number" ? { step: "0.01", min: "0" } : {})}
                      required={["nombre"].includes(field)}
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
