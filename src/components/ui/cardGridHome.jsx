// import { Label } from "@/components/ui/label";
// import React, { useRef } from "react";
// import { CardInstanceHome } from "@/components/ui/cardInstanceHome";

// export function CardGridHome({ products, category }) {
//   const containerRef = useRef(null);

//   return (
//     <div className="py-4">
//       {/* Etiqueta de la categoría */}
//       <div className="flex justify-start overflow-hidden mb-2">
//         <Label className="text-left text-lg font-bold truncate">{category.toUpperCase()}</Label>
//       </div>

//       {/* Contenedor de las tarjetas */}
//       <div className="container mx-auto">
//         <div
//           ref={containerRef}
//           className="flex overflow-x-auto overflow-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth gap-x-4"
//         >
//           {products.map((product, index) => (
//             <div key={index} className="snap-center flex-shrink-0 w-[260px]">
//               <CardInstanceHome product={product} />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


import { Label } from "@/components/ui/label";
import React from "react";
import { CardInstanceHome } from "@/components/ui/cardInstanceHome";

export function CardGridHome({ products, category }) {
  return (
    <div className="py-4">
      {/* Etiqueta de la categoría */}
      <div className="flex justify-start mb-4">
        <Label className="text-left text-lg font-bold truncate">{category.toUpperCase()}</Label>
      </div>

      {/* Contenedor de la grid */}
      <div className="grid grid-cols-2 p-2 gap-4"> {/* Grid con 2 columnas y espacio entre tarjetas */}
        {products.map((product, index) => (
          <CardInstanceHome key={index} product={product} />
        ))}
      </div>
    </div>
  );
}
