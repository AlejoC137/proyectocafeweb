import React, { useState, useEffect } from "react";
import { CardInstanceInventario } from "@/components/ui/cardInstanceInventario";
import { copiarAlPortapapeles } from "../../redux/actions";
import { ItemsAlmacen, ProduccionInterna } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { CardInstanceInventarioMenu } from "@/components/ui/cardInstanceInventarioMenu";

export function CardGridInventarioMenu({ products, showEdit }) {
  return (
    <div className="flex flex-col gap-2 ml-4 mr-4">
      {products.map((product) => (
        <CardInstanceInventarioMenu
          key={product._id}
          product={product}
          showEdit={showEdit}
        />
      ))}
    </div>
  );
}
