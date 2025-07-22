import { CATEGORIES_t, ENLATADOS } from "../../../redux/actions-types";

function Encabezado({ GRUPO, isEnglish }) {
  const translation = CATEGORIES_t[GRUPO];
  const label = translation ? (isEnglish ? translation.en : translation.es) : GRUPO;

  return (
    <div className="text-md truncate font-SpaceGrotesk bg-red-500 " style={{ fontSize: '16px' }}> 
      {GRUPO === ENLATADOS ?  <h2>Enbotellados</h2> : <h2>{label}</h2>}
    </div>
  );
}

export default Encabezado;
