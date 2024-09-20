'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CardInstance({ product, isEnglish }) {
  return (
    <Card className="w-[260px] h-full shadow-lg rounded-xl overflow-hidden">  {/* Set height to 100% */}
      {/* Image Section */}
      <div className="relative h-[220px] w-full">
        <img
          src={product.Foto}
          alt={isEnglish ? product.NombreEN : product.NombreES}
          className="w-full h-full object-cover"
        />
        {/* Favorite Icon */}
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/70 rounded-full p-1">
          <Heart className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Content Section */}
      <CardContent className="p-2 flex flex-col justify-between text-gray-900">
        {/* Name and Price on the Same Line */}
        <div className="flex justify-between items-center">
          <h3 className="text-md font-bold truncate">{isEnglish ? product.NombreEN : product.NombreES}</h3>
          <span className="text-lg font-semibold text-gray-800">${product.Precio}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES}
        </p>

        {/* Rating and Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <span className="text-gray-700 mr-1">{product.rating}</span>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <span className="text-gray-500">{product.AproxTime} min 🕐</span>
        </div>
      </CardContent>
    </Card>
  )
}
