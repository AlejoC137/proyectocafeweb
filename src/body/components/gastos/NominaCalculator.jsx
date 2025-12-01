import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const NominaCalculator = ({ staffId, onTotalCalculated }) => {
    const staff = useSelector((state) => state.allStaff || []);
    const [calculation, setCalculation] = useState(null);
    const [periodo, setPeriodo] = useState({ start: "", end: "" });

    useEffect(() => {
        if (!staffId) return;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();

        let startDate, endDate;

        if (day <= 15) {
            // Estamos en la primera quincena, mostrar la segunda quincena del mes ANTERIOR
            startDate = new Date(year, month - 1, 16);
            endDate = new Date(year, month, 0); // Último día del mes anterior
        } else {
            // Estamos en la segunda quincena, mostrar la primera quincena del mes ACTUAL
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month, 15);
        }

        // Format dates for display and comparison
        // Use local date string to avoid timezone shifts when just displaying dates
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${da}`;
        };

        setPeriodo({ start: formatDate(startDate), end: formatDate(endDate) });

        const selectedStaff = staff.find((s) => s._id === staffId);
        if (!selectedStaff) return;

        const result = calculatePayroll(selectedStaff, startDate, endDate);
        setCalculation(result);
        onTotalCalculated(result.totalNomina);

    }, [staffId, staff]);

    const calculatePayroll = (persona, start, end) => {
        let turnos = [];
        if (Array.isArray(persona.Turnos)) {
            turnos = persona.Turnos;
        } else if (typeof persona.Turnos === "string" && persona.Turnos.trim()) {
            try {
                const parsed = JSON.parse(persona.Turnos);
                turnos = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                turnos = [];
            }
        }

        const turnosNormalizados = turnos.map((t) => ({
            turnoDate: t.fecha || t.turnoDate || t.date || "",
            horaInicio: t.horaInicio || t.horaEntrada || t.hora || "00:00",
            horaSalida: t.horaCierre || t.horaSalida || t.horaFin || "00:00",
        }));

        const turnosFiltrados = turnosNormalizados.filter((turno) => {
            if (!turno.turnoDate) return false;
            // Compare string dates directly (YYYY-MM-DD)
            const fechaTurnoStr = turno.turnoDate.split('T')[0];

            const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

            return fechaTurnoStr >= startStr && fechaTurnoStr <= endStr;
        });

        const horasTrabajadas = turnosFiltrados.reduce((acumulador, turno) => {
            if (!turno.horaInicio || !turno.horaSalida || turno.horaSalida === "PENDING") {
                return acumulador;
            }
            const [horaInicioStr, minutoInicioStr] = turno.horaInicio.split(":");
            const [horaSalidaStr, minutoSalidaStr] = turno.horaSalida.split(":");

            const horasTurno =
                (parseInt(horaSalidaStr, 10) - parseInt(horaInicioStr, 10)) +
                (parseInt(minutoSalidaStr, 10) - parseInt(minutoInicioStr, 10)) / 60;

            return acumulador + (horasTurno > 0 ? horasTurno : 0);
        }, 0);

        let propinas = 0;
        if (Array.isArray(persona.Propinas)) {
            propinas = persona.Propinas
                .filter((propina) => {
                    const fechaPropinaStr = new Date(propina.tipDia).toISOString().split('T')[0];
                    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                    return fechaPropinaStr >= startStr && fechaPropinaStr <= endStr;
                })
                .reduce((total, propina) => total + parseFloat(propina.tipMonto), 0);
        }

        const baseRate = Number(persona.Rate) || 0;
        const pagoBase = horasTrabajadas * baseRate;
        const seguridadSocial = pagoBase * 0.1; // 10% safety/social security
        const totalPropinas = parseFloat((propinas / 1000).toFixed(3)); // Assuming propinas logic from reference

        const totalNomina = Math.round(pagoBase + seguridadSocial + totalPropinas);

        return {
            horasTrabajadas: parseFloat(horasTrabajadas.toFixed(2)),
            rate: baseRate,
            pagoBase: Math.round(pagoBase),
            seguridadSocial: Math.round(seguridadSocial),
            totalPropinas,
            totalNomina
        };
    };

    if (!calculation) return <div className="text-gray-500 text-sm">Cargando información de nómina...</div>;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
            <h4 className="font-semibold text-blue-800 mb-2">Cálculo de Nómina Sugerido</h4>
            <p className="text-xs text-blue-600 mb-3">Periodo: {periodo.start} al {periodo.end}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-gray-600 block">Horas Trabajadas:</span>
                    <span className="font-medium">{calculation.horasTrabajadas} hrs</span>
                </div>
                <div>
                    <span className="text-gray-600 block">Tarifa (Rate):</span>
                    <span className="font-medium">${calculation.rate.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-600 block">Pago Base:</span>
                    <span className="font-medium">${calculation.pagoBase.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-600 block">Seguridad (10%):</span>
                    <span className="font-medium">${calculation.seguridadSocial.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-600 block">Propinas:</span>
                    <span className="font-medium">${calculation.totalPropinas.toLocaleString()}</span>
                </div>
                <div className="col-span-2 border-t border-blue-200 pt-2 mt-1">
                    <span className="text-blue-800 font-bold block">Total a Pagar:</span>
                    <span className="text-xl font-bold text-blue-700">${calculation.totalNomina.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default NominaCalculator;
