import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import supabase from "../../../config/supabaseClient";

function Propina() {
    const [amount, setAmount] = useState("");
    const [metodo, setMetodo] = useState("efectivo");
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert("Por favor ingrese un monto válido");
            return;
        }

        setLoading(true);
        try {
            // Removed date-fns import, using native Date

            const { error } = await supabase
                .from('Propinas')
                .insert([
                    {
                        cantidad: parseFloat(amount),
                        metodo_pago: metodo,
                        tiempo: new Date().toISOString()
                    }
                ]);

            if (error) {
                throw error;
            }

            alert("Propina guardada correctamente");
            setAmount("");
            setMetodo("efectivo");
        } catch (error) {
            console.error("Error saving tip:", error);
            alert("Error al guardar la propina");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 h-10">
            {/* Selector de Método de Pago */}
            <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger className="w-[140px] h-full bg-white border-2 border-slate-300 font-medium">
                    <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
            </Select>

            {/* Input de Cantidad */}
            <Input
                type="number"
                placeholder="Monto..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-80 h-full bg-white border-2 border-slate-300 font-bold text-center"
            />

            {/* Botón de Agregar */}
            <Button
                onClick={handleAdd}
                disabled={loading}
                className="h-full gap-2 border-2 font-bold bg-white border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-800"
            >
                {loading ? "..." : "Agregar Propina"}
            </Button>
        </div>
    );
}

export default Propina;
