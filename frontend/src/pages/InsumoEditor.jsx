// Crear (/insumos/nuevo) o editar/reabastecer (/insumos/:id/editar) un insumo.
import { Link, useNavigate, useParams } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import FormularioInsumo from '../components/FormularioInsumo.jsx';
import { Cargando, MensajeError } from '../components/Estados.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { actualizarInsumo, crearInsumo, getInsumo } from '../services/api.js';

export default function InsumoEditor() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { avisar } = useAvisos();
  const actual = useFetch(() => (editando ? getInsumo(id) : Promise.resolve(null)), [id]);

  async function guardar(datos) {
    const guardado = editando ? await actualizarInsumo(id, datos) : await crearInsumo(datos);
    avisar(editando ? `“${guardado.nombre}” guardado` : `“${guardado.nombre}” creado`);
    navigate(`/insumos/${guardado.id}`);
  }

  const migas = [
    { texto: 'Inventario' },
    { texto: 'Insumos', a: '/insumos' },
    ...(editando ? [{ texto: actual.datos?.nombre ?? '…', a: `/insumos/${id}` }, { texto: 'Editar' }] : [{ texto: 'Nuevo' }]),
  ];

  return (
    <>
      <Encabezado
        migas={migas}
        titulo={editando ? `Editar ${actual.datos?.nombre ?? 'insumo'}` : 'Nuevo insumo'}
        descripcion={editando ? 'Para reabastecer, escribí el stock total que hay ahora después de la compra.' : 'Después podés usarlo en la receta de cualquier producto.'}
      />

      {actual.cargando && <Cargando />}
      <MensajeError error={actual.error}>
        <Link to="/insumos" className="boton boton--secundario boton--chico">Volver a insumos</Link>
      </MensajeError>

      {!actual.cargando && !actual.error && (
        <FormularioInsumo
          key={id ?? 'nuevo'}
          inicial={actual.datos}
          textoBoton={editando ? 'Guardar cambios' : 'Crear insumo'}
          onGuardar={guardar}
          onCancelar={() => navigate(editando ? `/insumos/${id}` : '/insumos')}
        />
      )}
    </>
  );
}
