"'use client'"

import React, { useState } from "'react'"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Info, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CardInstance({ product, isEnglish }) {
  const [showDescription, setShowDescription] = useState(false)
console.log(product);

  return (
    (<Card
      className="w-[350px] h-[450px] overflow-hidden relative transition-all duration-300 hover:shadow-xl"
      onClick={() => setShowDescription(!showDescription)}>
      <div className="absolute inset-0">
        <img
          src={product.Foto}
          alt={isEnglish ? product.NombreEN : product.NombreES}
          className="w-full h-full object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-60"></div>
      </div>
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>{isEnglish ? "'Add to Cart'" : "'Agregar al Carrito'"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Info className="mr-2 h-4 w-4" />
              <span>{isEnglish ? "'Details'" : "'Detalles'"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Heart className="mr-2 h-4 w-4" />
              <span>{isEnglish ? "'Favorite'" : "'Favorito'"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {isEnglish ? product.NombreEN : product.NombreES}
        </h2>
        <p className="text-lg font-semibold mb-2">
          ${product.Precio.toLocaleString()}
        </p>
        <p
          className={`text-sm mb-4 transition-all duration-300 ${
            showDescription ? "'opacity-100 max-h-40'" : "'opacity-0 max-h-0'"
          } overflow-hidden`}>
          {isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES}
        </p>
      </CardContent>
      <CardFooter
        className="absolute bottom-0 left-0 right-0 z-10 flex justify-center p-4 bg-black bg-opacity-50">
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/20 hover:bg-white/40 text-white transition-colors duration-300"
          onClick={(e) => {
            e.stopPropagation()
            setShowDescription(!showDescription)
          }}>
          {showDescription ? (isEnglish ? "'Hide Details'" : "'Ocultar Detalles'") : (isEnglish ? "'Show Details'" : "'Mostrar Detalles'")}
        </Button>
      </CardFooter>
    </Card>)
  );
}