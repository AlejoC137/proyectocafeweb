import CardGridAgenda from "./CardGridAgenda";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { AGENDA } from "../../../redux/actions-types";

function MenuMenu({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados.

**Desayuno:** 8:00 am - 11:30 am.
**Almuerzo:** cambia cada día, inicia a 12:30.
**Después de las 3:00 pm la cocina puede estar cerrada.**
`,
      Table: [
        { Producto: "Verduras", Origen: "Granja de Juan" },
        { Producto: "Frutas", Origen: "Yurley - Plaza Minorista" },
        { Producto: "Pan de masa madre", Origen: "Carlos - @lapanaderiamodou" },
        { Producto: "Café", Origen: "Santa Bárbara, Antioquia - Marta @cafe_lucus" },
      ],
    },
    EN: {
      Intro: `At Proyecto Café we do everything we can to serve dishes and drinks with fresh, well-cared ingredients.
      
**Breakfast:** 8:00 am - 11:30 am. 
**Lunch:** changes daily, starts at 12:30. 
**After 3:00 pm, the kitchen maybe closed.**`,
      Table: [
        { Product: "Vegetables", Origin: "Juan's farm" },
        { Product: "Fruits", Origin: "Yurley - Minorista market" },
        { Product: "Sourdough bread", Origin: "Carlos - @lapanaderiamodou" },
        { Product: "Coffee", Origin: "Santa Bárbara, Antioquia - Marta @cafe_lucus" },
      ],
    },
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;
  const tableData = isEnglish ? infoFija.EN.Table : infoFija.ES.Table;

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // await Promise.all([dispatch(getAllFromTable(AGENDA))]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const allAgenda = useSelector((state) => state.allAgenda);

  // This function splits the text by the bold markers and wraps the content in <strong> tags.
  const renderTextWithBold = (introText) => {
    // Split the text by the pattern (**...**), keeping the matched parts
    const parts = introText.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      // If the part is a marker (starts and ends with **), render it as bold
      if (part.startsWith('**') && part.endsWith('**')) {
        // Return the content inside the markers, wrapped in a <strong> tag
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      // Otherwise, return the text part as is
      return part;
    });
  };

  return (
    <div className="text-md font-SpaceGrotesk whitespace-pre-line" style={{ fontSize: '18px' }}>
      <div className="text-center mb-4">
        <h1 className="text-3xl font-LilitaOne font-bold leading-tight">
          {isEnglish ? "More about the menu." : "Más sobre el menú."}
        </h1>
      </div>

      {/* The main intro text is now processed to handle bolding */}
      <p className="text-justify mb-4">
        {renderTextWithBold(text)}
      </p>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-gray-300 text-left">
            <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx}>
              <td className="px-0 py-0 font-bold">
            {(row.Product || row.Producto) + ":"}
              </td>
              <td className="px-0 py-0">{row.Origin || row.Origen}</td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
        
 
      <div className="text-center mb-2 font-bold">
        <span>{isEnglish ? "Scan the QR for more info." : "Escanea el QR para más info."}</span>
        {/* <img src="ruta_del_qr.png" alt="QR" className="mx-auto mt-2" /> */}
      </div>
      
      {/* <CardGridAgenda data={allAgenda} isEnglish={isEnglish} /> */}
    </div>
  );
}

export default MenuMenu;