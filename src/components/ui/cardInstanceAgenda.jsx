import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Users, Clock, ExternalLink } from "lucide-react";

export function CardInstanceAgenda({ product, onDelete }) {
  const navigate = useNavigate();

  const handleViewEvento = () => {
    navigate(`/evento/${product._id}`);
  };

  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo">
      {/* Imagen del banner */}
      <div className="relative h-[200px] w-full">
        <img
          src={product.bannerIMG || "/default-image.jpg"}
          alt={product.nombre || "Evento"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido del evento */}
      <CardContent className="p-4 flex flex-col gap-2 text-gray-900">
        {/* Nombre del evento */}
        <h3 className="text-xl font-bold">{product.nombre || "Nombre del Evento"}</h3>

        {/* Fecha y hora */}
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">📅 Fecha:</span> {product.fecha}
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-1">
            <Clock size={14} className="text-gray-900" />
            <span className="font-medium text-gray-900">Hora:</span> {product.horaInicio} - {product.horaFinal}
          </p>
          {product.numeroPersonas && (
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <Users size={14} className="text-gray-900" />
              <span className="font-medium text-gray-900">Personas:</span> {product.numeroPersonas}
            </p>
          )}
        </div>

        {/* Cliente */}
        {product.nombreCliente && (
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Cliente:</span> {product.nombreCliente}
          </p>
        )}

        {/* Valor */}
        {product.valor && (
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Valor:</span> {product.valor}
          </p>
        )}

        {/* Botones de acción */}
        <div className="mt-2 space-y-2">
          {product.linkInscripcion && (
            <a href={product.linkInscripcion} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2">
                <ExternalLink size={16} />
                Inscribirse
              </Button>
            </a>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleViewEvento}
              className="flex-1 gap-1"
            >
              <Eye size={14} />
              Ver Detalles
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => onDelete(product)}
                className="flex-1 gap-1"
              >
                <Trash2 size={14} />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
