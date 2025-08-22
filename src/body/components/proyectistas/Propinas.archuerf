import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProyectistas, agregarPropina, postDay, getDays } from '../../../redux/actions'; // Importa la acción postDay

function Propinas() {
    const [diaAbierto, setDiaAbierto] = useState(false); // Estado para indicar si el día está abierto o cerrado
    const [latestDayId, setLatestDayId] = useState(null); // Estado para almacenar el ID del último día encontrado
    const dispatch = useDispatch();
    const days = useSelector(state => state.days); // Assuming you have a Redux state slice for days

    useEffect(() => {
        // Obtener los días cuando el componente se monta
        dispatch(getDays());
    }, []);

    useEffect(() => {
        // Verificar si hay un día que coincida con la fecha actual y actualizar el estado del día abierto
        const currentDate = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
        const currentDay = days.find(day => day.date.split('T')[0] === currentDate);
        if (currentDay) {
            setDiaAbierto(true);
            // Almacenar el ID del último día encontrado
            setLatestDayId(currentDay._id);
        } else {
            setDiaAbierto(false);
            setLatestDayId(null);
        }
    }, [days]);

    const handleAgregarPropina = () => {
        const propinaInput = document.getElementById("propinaInput");
        const valor = propinaInput.value.trim();

        if (valor && latestDayId) {
            const timestamp = new Date().toISOString();
            dispatch(agregarPropina(latestDayId, timestamp, valor)); // Utilizar el ID del último día encontrado
            propinaInput.value = ''; // Limpiar el input después de agregar la propina
        } else {
            console.log('Ingrese un valor válido para la propina o asegúrese de que haya un día abierto.');
        }
    };

    const handleIniciarDia = () => {
        // Establecer el estado del día como abierto
        setDiaAbierto(true);
        // Deshabilitar el botón "Iniciar Día" después de hacer clic en él
        document.getElementById("btnIniciarDia").disabled = true;

        // Obtener la fecha y hora del momento del clic
        const fechaHoraClic = new Date().toISOString();

        // Objeto a enviar en la acción postDay
        const postData = {
            type: "Proyectista",
            category: 'Dias',
            propinas: [],
            turnos: {
                turno1:{
                    staff:[],
                    propinas:[],                
                },
                turno2:{
                    staff:[],
                    propinas:[],                
                },
                turno3:{
                    staff:[],
                    propinas:[],                
                },
            }
        ,
            date: fechaHoraClic
        };

        // Llamar a la acción postDay con el objeto postData
        dispatch(postDay(postData));
    };

    const handleCerrarDia = () => {
        // Aquí deberías tener una función para cerrar el día, que actualice el estado del día a cerrado
        // Por ahora, solo lo establecemos en false
        setDiaAbierto(false);
        // Deshabilitar el botón "Cerrar Día" después de hacer clic en él
        document.getElementById("btnCerrarDia").disabled = true;
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <label htmlFor="propinaInput">Ingresar Propina:</label>
                <input id="propinaInput" type="text" />
                {/* El botón de agregar propina se habilita o deshabilita según el estado del día */}
                <button onClick={handleAgregarPropina} disabled={!diaAbierto}>Agregar Propina</button>
            </div>
            {/* Botón para iniciar el día */}
            <button id="btnIniciarDia" onClick={handleIniciarDia} disabled={diaAbierto}>Iniciar Día</button>
            {/* Botón para cerrar el día, solo habilitado si el día ha sido iniciado */}
            <button id="btnCerrarDia" onClick={handleCerrarDia} disabled={!diaAbierto}>Cerrar Día</button>
        </div>
    );
}

export default Propinas;
