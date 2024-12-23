import React from "react";
import { CardInstanceInventarioMenu } from "@/components/ui/cardInstanceInventarioMenu";

export function CardGridInventarioMenu({ products, showEdit }) {
  const groupedProducts = products.reduce((acc, product) => {
    const group = product.GRUPO || "Sin Grupo";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(product);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4">
      {Object.keys(groupedProducts).map((group) => (
        <div key={group}>
          <h2 className="text-xl font-bold">{group}</h2>
          {groupedProducts[group].map((product) => (
            <CardInstanceInventarioMenu
              key={product._id}
              product={product}
              showEdit={showEdit}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
