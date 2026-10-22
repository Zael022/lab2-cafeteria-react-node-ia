import { Link } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';

export default function NoEncontrado() {
  return (
    <>
      <Encabezado titulo="Esta página no existe" descripcion="Puede que el enlace esté mal escrito. Usá el menú o volvé al inicio." />
      <div className="formulario__acciones formulario__acciones--izquierda">
        <Link to="/" className="boton boton--primario">Ir al panel del día</Link>
        <Link to="/venta" className="boton boton--secundario">Nueva venta</Link>
      </div>
    </>
  );
}
