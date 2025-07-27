"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ESP } from "../../redux/actions-types"

export function CardInstance({ product, isEnglish, onClick }) {
  const leng = isEnglish === ESP ? false : true
  const [showDetail, setShowDetail] = useState(false)

  const dietWarning = leng ? product.DietaEN : product.DietaES
  const careWarning = leng ? product.CuidadoEN : product.CuidadoES

  const renderIcons = () => {
    const icons = []
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(<Leaf key="vegetarian" className="h-4 w-4 text-green-400 mr-2 drop-shadow-md" title="Vegetarian" />)
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(<Leaf key="vegan" className="h-4 w-4 text-green-300 mr-2 drop-shadow-md" title="Vegan" />)
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(<Flame key="meat" className="h-4 w-4 text-red-400 mr-2 drop-shadow-md" title="Meat" />)
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(<Flame key="spicy" className="h-4 w-4 text-red-400 mr-2 drop-shadow-md" title="Spicy" />)
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(
        <AlertTriangle key="nuts" className="h-4 w-4 text-orange-400 mr-2 drop-shadow-md" title="Contains Walnuts" />,
      )
    }

    return icons
  }

  // Helper to format price as 6K, 1.2K, etc.
  const formatPrice = (price) => {
    if (price >= 1000) {
      return (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + "K"
    }
    return price
  }

  return (
    <Card
      className="w-[280px] h-[280px] flex-shrink-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0 relative">
        <div className="aspect-square overflow-hidden  bg-gray-100 relative">
          <img
            src={product.Foto || "/placeholder.svg"}
            alt={leng ? product.NombreEN : product.NombreES}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />

          {/* Botón de carrito en la esquina superior derecha */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-lg z-10"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />
          </Button>

          {/* Overlay con gradiente suave para mejor legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

          {/* Contenido de texto superpuesto */}
          <div className="absolute bottom-0  left-0 right-0 p-2 text-white">
            <div className="space-y-2">
             
             <div className="flex items-center justify-between">
             <h3 className="font-semibold text-lg line-clamp-2 drop-shadow-xl ">
                {leng ? product.NombreEN : product.NombreES}
              </h3>
              <p
                className="text-sm text-gray-100 line-clamp-1 drop-shadow-lg"
              >
                {leng? "Click for more details" : "Click para mas detalles" }
              </p>
      </div>
              <div className="flex items-center justify-between ">
                <Badge
                  variant="destructive"
                  className="text-lg font-bold  text-white  shadow-lg"
                >
                  ${formatPrice(product.Precio)}
                </Badge>
                <span className="text-gray-100 text-xs px-2 py-1 rounded-full shadow-md">
                  {product.AproxTime} min 🕐
                </span>
              </div>

              <div className="flex items-center mt-1">{renderIcons()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
