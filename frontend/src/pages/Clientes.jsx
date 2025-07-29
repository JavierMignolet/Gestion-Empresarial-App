import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Clientes() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    cuit_dni: "",
    direccion: "",
    telefono: "",
    email: "",
    condicion_iva: "",
  });

  const fetchClientes = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/clientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(res.data);
    } catch (err) {
      setError("No se pudieron cargar los clientes");
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [token]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openNuevo = () => {
    setEditMode(false);
    setFormData({
      id: null,
      nombre: "",
      cuit_dni: "",
      direccion: "",
      telefono: "",
      email: "",
      condicion_iva: "",
    });
    setShowModal(true);
  };

  const openEditar = (cliente) => {
    setEditMode(true);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `http://localhost:4000/api/clientes/${formData.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("http://localhost:4000/api/clientes", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      setError("Error al guardar el cliente");
    }
  };

  const eliminarCliente = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar este cliente?")) {
      try {
        await axios.delete(`http://localhost:4000/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchClientes();
      } catch (err) {
        setError("Error al eliminar el cliente");
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Clientes registrados</h3>
        <button className="btn btn-primary" onClick={openNuevo}>
          Agregar cliente
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {clientes.length === 0 ? (
        <p>No hay clientes cargados aún.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>CUIT / DNI</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Cond. IVA</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, index) => (
                <tr key={cliente.id}>
                  <td>{index + 1}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.cuit_dni}</td>
                  <td>{cliente.direccion}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.condicion_iva}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => openEditar(cliente)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarCliente(cliente.id)}
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
                  {editMode ? "Editar cliente" : "Nuevo cliente"}
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
                  "cuit_dni",
                  "direccion",
                  "telefono",
                  "email",
                  "condicion_iva",
                ].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">
                      {field.replace("_", " ").toUpperCase()}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="form-control"
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

export default Clientes;
