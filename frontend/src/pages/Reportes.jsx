// src/pages/Reportes.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function Reportes() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  // Filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Datos
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // UI: vista detalle
  const [detalle, setDetalle] = useState(null); // {grupo, key, title}

  const fetchReport = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await axios.get("http://localhost:4000/api/reportes", {
        headers,
        params,
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const volver = () => setDetalle(null);
  const goto = (grupo, key, title) => setDetalle({ grupo, key, title });

  /* ======= Tablas ======= */

  const TablaStockActual = () => {
    const lotes = data?.productivos?.stock_actual || [];
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Stock actual por lote (DESC por lote)</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Lote</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={`${l.producto}-${l.lote}`}>
                  <td>{l.lote}</td>
                  <td>{l.producto}</td>
                  <td>{l.stock}</td>
                  <td>
                    {l.stock <= 0 ? (
                      <span className="badge bg-danger">Agotado</span>
                    ) : (
                      <span className="badge bg-success">Disponible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const TablaInsumosAlerta = () => {
    const rojos = data?.productivos?.insumos_alerta?.rojos || [];
    const amarillos = data?.productivos?.insumos_alerta?.amarillos || [];
    const filas = [...rojos, ...amarillos];

    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Insumos en alerta</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Cobertura (días)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td>{f.insumo}</td>
                  <td>{f.cantidad}</td>
                  <td>{f.unidad}</td>
                  <td>
                    <span
                      className={`badge ${
                        f.estado === "rojo"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {f.estado.toUpperCase()}
                    </span>
                  </td>
                  <td>{f.cobertura_dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const TablaPedidosPendientes = () => {
    const filas = data?.productivos?.pedidos_pendientes || [];
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Pedidos pendientes</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Fecha pedido</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Fecha estimada</th>
                <th>Señado/Pagado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p, i) => (
                <tr key={i}>
                  <td>
                    {p.fecha_pedido
                      ? new Date(p.fecha_pedido).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{p.cliente || "-"}</td>
                  <td>{p.producto || "-"}</td>
                  <td>{p.cantidad ?? "-"}</td>
                  <td>
                    {p.fecha_estimada
                      ? new Date(p.fecha_estimada).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{p.senado_pagado ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // === Stock seguridad vs consumo (ACTUALIZADO)
  const TablaStockSeguridad = () => {
    const info = data?.productivos?.stock_seguridad || {};
    const consumoProm = info.consumo_promedio_quincenal_global ?? 0;
    const items = info.items || [];

    // Convertimos a días y categorizamos con colores + orden
    const clasificados = items
      .map((f) => {
        const dias =
          f.cobertura_semanas != null
            ? Math.round(f.cobertura_semanas * 7)
            : null;
        let cat = "verde";
        if (dias == null) cat = "verde";
        else if (dias < 7) cat = "rojo";
        else if (dias <= 15) cat = "amarillo";
        else if (dias <= 21) cat = "naranja";
        else cat = "verde";
        return { ...f, cobertura_dias: dias, cat };
      })
      .sort((a, b) => {
        const order = { rojo: 0, amarillo: 1, naranja: 2, verde: 3 };
        if (order[a.cat] !== order[b.cat]) return order[a.cat] - order[b.cat];
        // dentro de cada categoría, menor cobertura primero
        return (a.cobertura_dias ?? 9999) - (b.cobertura_dias ?? 9999);
      });

    const badgeClass = (cat) =>
      ({
        rojo: "bg-danger",
        amarillo: "bg-warning text-dark",
        naranja: "bg-orange text-dark",
        verde: "bg-success",
      }[cat] || "bg-secondary");

    // pequeño style para naranja (Bootstrap no trae "bg-orange")
    const orangeStyle = `
      .bg-orange { background-color: #fd7e14 !important; }
    `;

    return (
      <div className="card p-3">
        <style>{orangeStyle}</style>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Stock de seguridad vs consumo</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>

        <div className="alert alert-info">
          <strong>Consumo promedio (quincenal total):</strong> {consumoProm}
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Cobertura (días)</th>
              </tr>
            </thead>
            <tbody>
              {clasificados.map((f, i) => (
                <tr key={i}>
                  <td>{f.insumo}</td>
                  <td>{f.cantidad}</td>
                  <td>{f.unidad}</td>
                  <td>
                    <span className={`badge ${badgeClass(f.cat)}`}>
                      {f.cobertura_dias ?? "-"}
                    </span>
                  </td>
                </tr>
              ))}
              {clasificados.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // === Ventas (ACTUALIZADO con comparativo mensual e historial)
const SeccionVentas = () => {
  const econ = data?.economicos || {};
  const objetivos = econ.objetivos || {
    objetivo_mensual_unidades: 0,
    objetivo_semestral_unidades: 0,
    objetivo_anual_unidades: 0,
  };

  const reales = econ.ventas_real || { mensual: 0, semestral: 0, anual: 0 };
  const compMensual = econ.comparativo_mensual || {
    real: reales.mensual || 0,
    objetivo: objetivos.objetivo_mensual_unidades || 0,
  };

  const historial = (econ.ventas_historial_mensual || []).slice().sort((a, b) => {
    // DESC por año/mes
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const comp = [
    {
      label: "Mensual",
      real: reales.mensual || 0,
      objetivo: objetivos.objetivo_mensual_unidades || 0,
    },
    {
      label: "Semestral",
      real: reales.semestral || 0,
      objetivo: objetivos.objetivo_semestral_unidades || 0,
    },
    {
      label: "Anual",
      real: reales.anual || 0,
      objetivo: objetivos.objetivo_anual_unidades || 0,
    },
  ];

  const [showChart, setShowChart] = useState(false);
  const [showHist, setShowHist] = useState(false);

  const dataset = useMemo(
    () =>
      comp.map((x) => ({
        name: x.label,
        Real: x.real,
        Objetivo: x.objetivo,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(comp)]
  );

  const fmtMes = (y, m) =>
    `${String(m).padStart(2, "0")}/${String(y)}`;

  return (
    <div className="card p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Ventas</h5>
        <button className="btn btn-outline-secondary" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Comparativo mensual destacado */}
      <div className="alert alert-primary d-flex justify-content-between align-items-center">
        <div>
          <strong>Real vs Objetivo (Mensual):</strong>{" "}
          <span className="fw-bold">
            {compMensual.real}/{compMensual.objetivo}
          </span>
        </div>
        <button
          className="btn btn-sm btn-outline-dark"
          onClick={() => setShowHist((v) => !v)}
        >
          {showHist ? "Ocultar historial" : "Ver historial mensual"}
        </button>
      </div>

      {showHist && (
        <div className="mb-3">
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Mes</th>
                  <th>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                  <tr key={`${h.year}-${h.month}-${idx}`}>
                    <td>{fmtMes(h.year, h.month)}</td>
                    <td>{h.unidades}</td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center">
                      Sin datos de historial
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cuadro: Objetivos */}
      <div className="mb-3">
        <h6 className="mb-2">🎯 Objetivos (unidades)</h6>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Mensual</th>
                <th>Semestral</th>
                <th>Anual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{objetivos.objetivo_mensual_unidades ?? 0}</td>
                <td>{objetivos.objetivo_semestral_unidades ?? 0}</td>
                <td>{objetivos.objetivo_anual_unidades ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cuadro: Reales */}
      <div className="mb-3">
        <h6 className="mb-2">📈 Ventas reales (unidades)</h6>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Mensual</th>
                <th>Semestral</th>
                <th>Anual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{reales.mensual ?? 0}</td>
                <td>{reales.semestral ?? 0}</td>
                <td>{reales.anual ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cuadro: Comparativo (las tres vistas) */}
      <div className="mb-3">
        <h6 className="mb-2">⚖️ Comparativo real vs objetivo</h6>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Mensual</th>
                <th>Semestral</th>
                <th>Anual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {comp.map((x) => (
                  <td key={x.label}>
                    <strong>
                      {x.real}/{x.objetivo}
                    </strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={() => setShowChart((v) => !v)}
        >
          {showChart ? "Ocultar gráfico" : "Ver gráfico"}
        </button>

        {showChart && (
          <div className="mt-3" style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={dataset}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Real" />
                <Bar dataKey="Objetivo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

  /* ======= UI ======= */

  const Filtros = (
    <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
      <div>
        <label className="form-label mb-1">Desde</label>
        <input
          type="date"
          className="form-control"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>
      <div>
        <label className="form-label mb-1">Hasta</label>
        <input
          type="date"
          className="form-control"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={fetchReport}
        disabled={loading}
      >
        {loading ? "Actualizando..." : "Actualizar"}
      </button>
      {err && <div className="text-danger ms-2">{err}</div>}
    </div>
  );

  const Menu = () => (
    <>
      <h4 className="mt-2">Productivos</h4>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => goto("productivos", "stock", "Stock actual")}
        >
          Stock actual
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => goto("productivos", "insumos", "Insumos en alerta")}
        >
          Insumos en alerta
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => goto("productivos", "pedidos", "Pedidos pendientes")}
        >
          Pedidos pendientes
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() =>
            goto("productivos", "seguridad", "Stock seguridad vs consumo")
          }
        >
          Stock seguridad vs consumo
        </button>
      </div>

      <h4 className="mt-2">Económicos</h4>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className="btn btn-outline-success"
          onClick={() => goto("economicos", "ventas", "Ventas")}
        >
          Ventas
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() => goto("economicos", "margenes", "Márgenes")}
        >
          Márgenes
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() => goto("economicos", "costos", "Costos")}
        >
          Costos
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() =>
            goto("economicos", "pe", "Punto de equilibrio / Cobertura CF")
          }
        >
          Punto de equilibrio / Cobertura CF
        </button>
      </div>
    </>
  );

  const TablaMargenes = () => {
    const e = data?.economicos || {};
    const filas = [
      { label: "Margen bruto %", valor: e.margen_bruto_pct, key: "bruto" },
      { label: "Margen neto %", valor: e.margen_neto_pct, key: "neto" },
    ];
    const [show, setShow] = useState({});
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Márgenes</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>

        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Indicador</th>
              <th className="text-end">Valor</th>
              <th>Gráfico</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td className="text-end">
                  {f.valor != null ? `${f.valor}%` : "-"}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setShow((s) => ({ ...s, [f.key]: !s[f.key] }))
                    }
                  >
                    {show[f.key] ? "Ocultar" : "Ver"} gráfico
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filas.map((f) =>
          show[f.key] ? (
            <div key={`m-${f.key}`} style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={[{ name: f.label, valor: f.valor ?? 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null
        )}
      </div>
    );
  };

  const TablaCostos = () => {
    const e = data?.economicos || {};
    const filas = [
      {
        label: "Costos fijos (rango)",
        valor: e.costo_fijo_total_rango ?? 0,
        key: "cf",
      },
      {
        label: "Costo variable unitario",
        valor: e.costo_variable_unitario ?? 0,
        key: "cvu",
      },
    ];
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Costos</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Indicador</th>
              <th className="text-end">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td className="text-end">{f.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const TablaPECobertura = () => {
    const e = data?.economicos || {};
    const filas = [
      {
        label: "Punto de equilibrio (unid.)",
        valor: e.punto_equilibrio_unidades,
        key: "peu",
      },
      {
        label: "Cobertura CF (%)",
        valor: e.cobertura_costos_fijos_pct,
        key: "ccf",
      },
    ];
    const [show, setShow] = useState({});
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Punto de equilibrio / Cobertura CF</h5>
          <button className="btn btn-outline-secondary" onClick={volver}>
            ← Volver
          </button>
        </div>

        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Indicador</th>
              <th className="text-end">Valor</th>
              <th>Gráfico</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const negativo = f.valor != null && f.valor < 0;
              return (
                <tr key={f.key}>
                  <td>{f.label}</td>
                  <td className="text-end">
                    <span
                      className={negativo ? "text-danger fw-bold" : "fw-bold"}
                    >
                      {f.valor != null ? Math.abs(f.valor) : "-"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        setShow((s) => ({ ...s, [f.key]: !s[f.key] }))
                      }
                    >
                      {show[f.key] ? "Ocultar" : "Ver"} gráfico
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const Detalle = () => {
    if (!detalle) return null;
    const { grupo, key } = detalle;

    if (grupo === "productivos") {
      if (key === "stock") return <TablaStockActual />;
      if (key === "insumos") return <TablaInsumosAlerta />;
      if (key === "pedidos") return <TablaPedidosPendientes />;
      if (key === "seguridad") return <TablaStockSeguridad />;
    }
    if (grupo === "economicos") {
      if (key === "ventas") return <SeccionVentas />;
      if (key === "margenes") return <TablaMargenes />;
      if (key === "costos") return <TablaCostos />;
      if (key === "pe") return <TablaPECobertura />;
    }
    return null;
  };

  return (
    <div>
      <h3 className="mb-3">📊 Reportes</h3>

      {/* Filtros */}
      <div className="mb-2">{Filtros}</div>

      {loading && <div>Cargando…</div>}
      {!loading && !detalle && <Menu />}
      {!loading && detalle && data && <Detalle />}
    </div>
  );
}

export default Reportes;
