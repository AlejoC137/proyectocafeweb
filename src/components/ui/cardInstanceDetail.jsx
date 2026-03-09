import React from "react";
import { ShoppingCart, Flame, Leaf, AlertTriangle, X, ChevronRight } from "lucide-react";
import { ESP } from "../../redux/actions-types";

export function CardInstanceDetail({ product, onClose, onNext, isEnglish }) {
  const leng = isEnglish === ESP ? false : true;

  const dietWarning = leng ? product.DietaEN : product.DietaES;
  const careWarning = leng ? product.CuidadoEN : product.CuidadoES;

  const renderIcons = () => {
    const icons = [];
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(<Leaf key="vegetarian" className="h-6 w-6 text-green-600 mr-2" title="Vegetarian" strokeWidth={2.5} />);
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(<Leaf key="vegan" className="h-6 w-6 text-green-500 mr-2" title="Vegan" strokeWidth={2.5} />);
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(<Flame key="meat" className="h-6 w-6 text-red-600 mr-2" title="Meat" strokeWidth={2.5} />);
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(<Flame key="spicy" className="h-6 w-6 text-red-600 mr-2" title="Spicy" strokeWidth={2.5} />);
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(
        <AlertTriangle key="nuts" className="h-6 w-6 text-orange-600 mr-2" title="Contains Walnuts" strokeWidth={2.5} />
      );
    }
    return icons;
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + "K";
    }
    return price;
  };

  return (
    <div className="relative w-full max-w-3xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Botón Cerrar (X) Brutalista */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 md:-top-4 md:-right-4 bg-white border-4 border-black p-1 md:p-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors duration-0 z-[60] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px]"
      >
        <X className="h-6 w-6" strokeWidth={3} />
      </button>

      <div className="w-full bg-white border-4 border-black flex flex-col md:flex-row shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-y-auto">
        {/* Sección de Imagen */}
        <div className="w-full md:w-1/2 relative border-b-4 md:border-b-0 md:border-r-4 border-black bg-gray-200 shrink-0">
          <img
            src={product.Foto || "/placeholder.svg"}
            alt={leng ? product.NombreEN : product.NombreES}
            className="w-full h-48 md:h-full object-cover min-h-[200px] md:min-h-full"
          />
          <div className="absolute top-3 left-3 bg-white border-4 border-black px-2 py-1 md:px-3 md:py-1 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
            <span className="text-black font-black uppercase text-xs md:text-sm tracking-wider">
              {product.AproxTime}m 🕐
            </span>
          </div>
        </div>

        {/* Sección de Contenido */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-between bg-white text-black rounded-none">
          <div>
            <h2 className="font-black text-2xl md:text-5xl uppercase tracking-tighter leading-[1] mb-4 md:mb-6 pr-8 md:pr-0">
              {leng ? product.NombreEN : product.NombreES}
            </h2>
            <p className="text-sm md:text-xl font-bold text-gray-700 tracking-wide border-l-4 border-black pl-3 md:pl-5 mb-6 md:mb-8">
              {leng ? product.DescripcionMenuEN : product.DescripcionMenuES}
            </p>
            <div className="flex items-center mb-4 md:mb-6">
              {renderIcons()}
              {renderIcons().length === 0 && <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-400 border-[3px] md:border-4 border-gray-200 px-2 py-1">Normal</span>}
            </div>
          </div>

          <div className="mt-2 md:mt-4 flex flex-col gap-4 md:gap-6">
            <div className="text-4xl md:text-6xl font-black tracking-tighter self-start mb-1 md:mb-2">
              ${formatPrice(product.Precio)}
            </div>

            <div className="flex gap-2 md:gap-4 w-full">
              <button
                onClick={onNext}
                className="flex-1 flex justify-center items-center gap-1 md:gap-2 bg-white border-[3px] md:border-4 border-black p-3 md:p-4 font-black uppercase text-lg md:text-2xl hover:bg-black hover:text-white transition-colors duration-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px]"
              >
                {leng ? "Next" : "Siguiente"} <ChevronRight className="h-6 w-6 md:h-8 md:w-8" strokeWidth={3} />
              </button>

              <button
                className="flex-none bg-[#FFDE00] border-[3px] md:border-4 border-black p-3 md:p-4 hover:bg-black hover:text-white transition-colors duration-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px]"
              >
                <ShoppingCart className="h-6 w-6 md:h-8 md:w-8" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
