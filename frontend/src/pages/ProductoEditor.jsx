// Crear (/productos/nuevo) o editar (/productos/:id/editar) un producto.
// La misma vista sirve para las dos cosas: si hay :id, es edición.
import { Link, useNavigate, useParams } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import FormularioProducto from '../components/FormularioProducto.jsx';
import { Cargando, MensajeError } from '../components/Estados.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { actualizarProducto, crearProducto, getProducto } from '../services/api.js';

export default function ProductoEditor() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { avisar } = useAvisos();
  const actual = useFetch(() => (editando ? getProducto(id) : Promise.resolve(null)), [id]);

  async function guardar(datos) {
    const guardado = editando ? await actualizarProducto(id, datos) : await crearProducto(datos);
    avisar(editando ? `“${guardado.nombre}” guardado` : `“${guardado.nombre}” creado`);
    navigate(`/productos/${guardado.id}`); // lleva al detalle de lo que se guardó
  }

  const migas = [
    { texto: 'Inventario' },
    { texto: 'Productos', a: '/productos' },
    ...(editando ? [{ texto: actual.datos?.nombre ?? '…', a: `/productos/${id}` }, { texto: 'Editar' }] : [{ texto: 'Nuevo' }]),
  ];

  return (
    <>
      <Encabezado
        migas={migas}
        titulo={editando ? `Editar ${actual.datos?.nombre ?? 'producto'}` : 'Nuevo producto'}
        descripcion={editando ? 'El precio nuevo solo afecta las ventas de ahora en adelante.' : 'Definí el precio y la receta: con ella se descuenta el inventario en cada venta.'}
      />

      {actual.cargando && <Cargando />}
      <MensajeError error={actual.error}>
        <Link to="/productos" className="boton boton--secundario boton--chico">Volver a productos</Link>
      </MensajeError>

      {!actual.cargando && !actual.error && (
        <FormularioProducto
          key={id ?? 'nuevo'}
          inicial={actual.datos}
          textoBoton={editando ? 'Guardar cambios' : 'Crear producto'}
          onGuardar={guardar}
          onCancelar={() => navigate(editando ? `/productos/${id}` : '/productos')}
        />
      )}
    </>
  );
}
