import { CATEGORIES_t, ENLATADOS } from "../../../redux/actions-types";

function Encabezado({ GRUPO, isEnglish }) {
  const translation = CATEGORIES_t[GRUPO];
  const label = translation ? (isEnglish ? translation.en : translation.es) : GRUPO;

  return (
    <div className="text-md font- truncate font-SpaceGrotesk" style={{ fontSize: '30px' }}> 
      {GRUPO === ENLATADOS ?  <h2>Enbotellados</h2> : <h2>{label}</h2>}
    </div>
  );
}

export default Encabezado;
