"use client"

import { useState } from "react"
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react"
import { ESP } from "../../redux/actions-types"

export function CardInstance({ product, isEnglish, onClick }) {
  const leng = isEnglish === ESP ? false : true

  const dietWarning = leng ? product.DietaEN : product.DietaES
  const careWarning = leng ? product.CuidadoEN : product.CuidadoES

  const renderIcons = () => {
    const icons = []
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(<Leaf key="vegetarian" className="h-5 w-5 text-green-600 mr-2" title="Vegetarian" strokeWidth={2.5} />)
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(<Leaf key="vegan" className="h-5 w-5 text-green-500 mr-2" title="Vegan" strokeWidth={2.5} />)
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(<Flame key="meat" className="h-5 w-5 text-red-600 mr-2" title="Meat" strokeWidth={2.5} />)
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(<Flame key="spicy" className="h-5 w-5 text-red-600 mr-2" title="Spicy" strokeWidth={2.5} />)
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(
        <AlertTriangle key="nuts" className="h-5 w-5 text-orange-600 mr-2" title="Contains Walnuts" strokeWidth={2.5} />,
      )
    }

    return icons
  }

  const formatPrice = (price) => {
    if (price >= 1000) {
      return (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + "K"
    }
    return price
  }

  return (
    <div
      className="w-full max-w-[400px] flex flex-col cursor-pointer transition-all duration-0 bg-cream-bg border-[3px] border-black group rounded-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] border-b-[3px] border-black overflow-hidden rounded-none bg-sage-green-light">
        <img
          src={product.Foto || "/placeholder.svg"}
          alt={leng ? product.NombreEN : product.NombreES}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Cart Button */}
        <button
          className="absolute top-2 right-2 bg-white border-[3px] border-black p-1.5 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors duration-0 z-10 active:shadow-none active:translate-y-[3px] active:translate-x-[3px]"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Details Badge */}
        <div className="absolute bottom-2 left-2 bg-white border-[3px] border-black p-1 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-10 hover:bg-cobalt-blue hover:text-white transition-colors duration-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </div>

        {/* Time Badge */}
        <div className="absolute top-2 left-2 bg-white border-[3px] border-black px-1.5 py-0.5 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-10">
          <span className="text-black font-black uppercase text-[10px] tracking-wider">
            {product.AproxTime}m
          </span>
        </div>
      </div>

      {/* Content Container - Compact Version */}
      <div className="p-3 flex items-start justify-between bg-white text-black rounded-none min-h-[64px] gap-2">

        <div className="flex flex-col flex-grow truncate">
          <h3 className="font-black text-lg uppercase tracking-tight leading-tight truncate">
            {leng ? product.NombreEN : product.NombreES}
          </h3>
          <p className="text-xs font-bold text-gray-500 tracking-wide truncate">
            {leng ? product.DescripcionMenuEN : product.DescripcionMenuES}
          </p>
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          <div className="text-xl font-black tracking-tighter">
            ${formatPrice(product.Precio)}
          </div>
          <div className="flex items-center gap-1 mt-1 -mr-1">
            {renderIcons()}
          </div>
        </div>

      </div>
    </div>
  )
}
