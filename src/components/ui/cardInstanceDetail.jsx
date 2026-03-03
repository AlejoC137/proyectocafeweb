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
    <div
      className="w-full max-w-3xl bg-white border-4 border-black flex flex-col md:flex-row shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Botón Cerrar (X) Brutalista */}
      <button
        onClick={onClose}
        className="absolute -top-4 -right-4 bg-white border-4 border-black p-2 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors duration-0 z-20 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px]"
      >
        <X className="h-6 w-6" strokeWidth={3} />
      </button>

      {/* Sección de Imagen */}
      <div className="w-full md:w-1/2 relative border-b-4 md:border-b-0 md:border-r-4 border-black bg-gray-200">
        <img
          src={product.Foto || "/placeholder.svg"}
          alt={leng ? product.NombreEN : product.NombreES}
          className="w-full h-full object-cover min-h-[300px] md:min-h-full"
        />
        <div className="absolute top-4 left-4 bg-white border-4 border-black px-3 py-1 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
          <span className="text-black font-black uppercase text-sm tracking-wider">
            {product.AproxTime}m 🕐
          </span>
        </div>
      </div>

      {/* Sección de Contenido */}
      <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-white text-black rounded-none">

        <div>
          <h2 className="font-black text-3xl md:text-5xl uppercase tracking-tighter leading-[1] mb-6">
            {leng ? product.NombreEN : product.NombreES}
          </h2>
          <p className="text-lg md:text-xl font-bold text-gray-700 tracking-wide border-l-4 border-black pl-5 mb-8">
            {leng ? product.DescripcionMenuEN : product.DescripcionMenuES}
          </p>
          <div className="flex items-center mb-6">
            {renderIcons()}
            {renderIcons().length === 0 && <span className="text-sm font-bold uppercase tracking-widest text-gray-400 border-4 border-gray-200 px-2 py-1">Normal</span>}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-6">
          <div className="text-5xl md:text-6xl font-black tracking-tighter self-start mb-2">
            ${formatPrice(product.Precio)}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={onNext}
              className="flex-1 flex justify-center items-center gap-2 bg-white border-4 border-black p-4 font-black uppercase text-xl md:text-2xl hover:bg-black hover:text-white transition-colors duration-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px]"
            >
              {leng ? "Next" : "Siguiente"} <ChevronRight className="h-8 w-8" strokeWidth={3} />
            </button>

            <button
              className="flex-none bg-[#FFDE00] border-4 border-black p-4 hover:bg-black hover:text-white transition-colors duration-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px]"
            >
              <ShoppingCart className="h-8 w-8" strokeWidth={3} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
