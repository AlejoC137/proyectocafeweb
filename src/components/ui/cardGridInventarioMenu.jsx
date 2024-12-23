import React, { useState, useEffect } from "react";
import { CardInstanceInventario } from "@/components/ui/cardInstanceInventario";
import { copiarAlPortapapeles } from "../../redux/actions";
import { ItemsAlmacen, ProduccionInterna } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";

export function CardGridInventarioMenu({ products, currentType }) {
  // Determinar el estado (PC o PP) según el tipo actual
  console.log(products);
  

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4 ">
      {currentType}
    </div>
  );
}
