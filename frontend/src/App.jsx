// Mapa de la aplicación: qué vista se muestra en cada dirección.
// Todas las vistas van dentro de <Layout>, que pone el menú lateral.
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';

import Panel from './pages/Panel.jsx';
import NuevaVenta from './pages/NuevaVenta.jsx';
import Pedidos from './pages/Pedidos.jsx';
import PedidoDetalle from './pages/PedidoDetalle.jsx';
import Productos from './pages/Productos.jsx';
import ProductoDetalle from './pages/ProductoDetalle.jsx';
import ProductoEditor from './pages/ProductoEditor.jsx';
import Insumos from './pages/Insumos.jsx';
import InsumoDetalle from './pages/InsumoDetalle.jsx';
import InsumoEditor from './pages/InsumoEditor.jsx';
import Asistente from './pages/Asistente.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Panel />} />

        <Route path="venta" element={<NuevaVenta />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetalle />} />

        <Route path="productos" element={<Productos />} />
        <Route path="productos/nuevo" element={<ProductoEditor />} />
        <Route path="productos/:id" element={<ProductoDetalle />} />
        <Route path="productos/:id/editar" element={<ProductoEditor />} />

        <Route path="insumos" element={<Insumos />} />
        <Route path="insumos/nuevo" element={<InsumoEditor />} />
        <Route path="insumos/:id" element={<InsumoDetalle />} />
        <Route path="insumos/:id/editar" element={<InsumoEditor />} />

        <Route path="asistente" element={<Asistente />} />

        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
